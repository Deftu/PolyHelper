import PolyHelperError from '../private/error.ts';
import { MessageFlags, type CommandInteraction, type Message } from 'discord.js';
import { downloadProfile, getSparkURL, removeProfile, saveProfile } from '../utils/sparkUtils.ts';
import { findModrinthProject } from '../utils/modrinthUtils.ts';
import { getChannelView, getFailedView, getLateView, getPendingView, getPrivateView } from './SparkViews.ts';
import { investigate } from './SparkAgent.ts';
import { runPrepass } from './SparkPrepass.ts';
import { toError } from '../utils/miscUtils.ts';
import type Application from '../Application.ts';
import type { SparkView } from './SparkViews.ts';
import type { SparkJob, SparkProfile, SparkRequest, SparkResult } from '../types/spark.ts';

const replyEditWindowMs = 14 * 60 * 1000;
const lateNoticeMs = 13 * 60 * 1000;

class SparkManager {
  private readonly running = new Set<string>();
  constructor(readonly application: Application) {}

  async scanSparkLog({ mode, sparkId, baselineId, supportNotes, interaction }: SparkRequest): Promise<void> {
    const config = this.application.config.sparkAnalysis;
    if (!config.enabled) throw new PolyHelperError('Spark analysis is disabled');
    if (baselineId === sparkId) throw new PolyHelperError('Pick two different spark profiles to compare');
    if (!interaction.channel) throw new PolyHelperError('Run this in a server channel');
    const runningKey = baselineId ? `${baselineId}:${sparkId}` : sparkId;
    if (this.running.has(runningKey)) throw new PolyHelperError('That spark profile is already being analyzed');

    const channel = await this.application.discord.getChannel('sparkAnalysis');
    this.running.add(runningKey);
    const [profile, baseline] = await Promise.allSettled([
      this.fetchProfile(sparkId),
      baselineId ? this.fetchProfile(baselineId) : Promise.resolve(null)
    ]);
    if (profile.status === 'rejected' || baseline.status === 'rejected') {
      this.running.delete(runningKey);
      await this.removeProfiles([
        profile.status === 'fulfilled' ? profile.value : null,
        baseline.status === 'fulfilled' ? baseline.value : null
      ]);
      throw profile.status === 'rejected' ? profile.reason : (baseline as PromiseRejectedResult).reason;
    }

    const job: SparkJob = {
      mode,
      profile: profile.value,
      baseline: baseline.value,
      supportNotes,
      channelId: interaction.channel.id,
      requester: interaction.user.id,
      startedAt: interaction.createdTimestamp
    };

    let channelMessage: Message;
    let privateMessage: Message;
    try {
      channelMessage = await channel.send(getPendingView(job, null));
      privateMessage = await interaction.followUp({
        ...getPendingView(job, channelMessage.url),
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
      });
    } catch (error) {
      this.running.delete(runningKey);
      await this.removeProfiles([job.profile, job.baseline]);
      throw error;
    }

    this.runJob(job, interaction, channelMessage, privateMessage).finally(() => this.running.delete(runningKey));
  }

  private async fetchProfile(sparkId: string): Promise<SparkProfile> {
    const profilePath = await saveProfile(sparkId, await downloadProfile(sparkId));
    return { sparkId, profilePath };
  }

  private async removeProfiles(profiles: (SparkProfile | null)[]) {
    for (const profile of profiles) {
      if (!profile) continue;
      await removeProfile(profile.profilePath).catch((error) => this.application.logError(toError(error)));
    }
  }

  private async editPrivate(interaction: CommandInteraction, message: Message, options: SparkView) {
    if (Date.now() - interaction.createdTimestamp > replyEditWindowMs) return;
    const { components, files, allowedMentions } = options;
    await interaction
      .editReply({ message: message.id, components, files, allowedMentions })
      .catch((error) => console.warn(`Could not edit the private spark reply: ${toError(error).message}`));
  }

  private async getIcon(modId: string | null | undefined, result: SparkResult): Promise<string | null> {
    if (!modId) return null;
    const scanned = result.prepass.scanned.find((mod) => mod.modId === modId);
    if (scanned) return scanned.iconUrl;
    return (await findModrinthProject(modId).catch(() => null))?.icon_url ?? null;
  }

  private async runJob(
    job: SparkJob,
    interaction: CommandInteraction,
    channelMessage: Message,
    privateMessage: Message
  ) {
    const config = this.application.config.sparkAnalysis;
    const lateTimer = setTimeout(
      () => {
        void this.editPrivate(interaction, privateMessage, getLateView(job, channelMessage.url));
      },
      lateNoticeMs - (Date.now() - interaction.createdTimestamp)
    );
    try {
      const prepass = await runPrepass(job, config);
      const result = await investigate(job, prepass, config);
      result.durationMs = Date.now() - job.startedAt;
      const primary = await this.getIcon(result.report?.primaryMod, result);
      const handoff = await this.getIcon(result.report?.handoff?.mod, result);
      await channelMessage.edit(getChannelView(job, result, { primary, handoff }));
      clearTimeout(lateTimer);
      await this.editPrivate(interaction, privateMessage, getPrivateView(job, result, channelMessage.url, primary));
    } catch (error) {
      clearTimeout(lateTimer);
      await this.application.logError(toError(error), [
        { name: 'Spark Profile', value: getSparkURL(job.profile.sparkId) },
        { name: 'Mode', value: job.mode }
      ]);
      const reason = error instanceof PolyHelperError ? error.message : 'This error has been reported to the devs';
      await channelMessage
        .edit(getFailedView(job, reason, null))
        .catch((editError) => this.application.logError(toError(editError)));
      await this.editPrivate(interaction, privateMessage, getFailedView(job, reason, channelMessage.url));
    } finally {
      clearTimeout(lateTimer);
      await this.removeProfiles([job.profile, job.baseline]);
    }
  }
}

export default SparkManager;
