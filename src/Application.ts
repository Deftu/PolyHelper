import DatabaseManager from './database/DatabaseManager.ts';
import DiscordManager from './discord/DiscordManager.ts';
import PolyHelperError from './private/error.ts';
import ScriptManager from './scripts/ScriptManager.ts';
import axios, { AxiosHeaders, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import packageJson from '../package.json' with { type: 'json' };
import { canSendMessages, getApplicationOwners } from './utils/discordUtils.ts';
import { execSync } from 'node:child_process';
import { getErrorEmbed, getErrorTypeName, toError } from './utils/miscUtils.ts';
import type { Config } from './types/config.ts';
import type { EmbedHelperField } from './types/discord.ts';
import type { RuntimeInformation, ValidErrors } from './types/application.ts';

class Application {
  readonly package: typeof packageJson = packageJson;
  readonly database: DatabaseManager;
  readonly discord: DiscordManager;
  readonly scripts: ScriptManager;
  constructor(readonly config: Config) {
    this.database = new DatabaseManager(this);
    this.discord = new DiscordManager(this);
    this.scripts = new ScriptManager(this);
  }

  async request<T>(url: string, config: AxiosRequestConfig = {}): Promise<AxiosResponse<T>> {
    const headers = new AxiosHeaders(config.headers as AxiosHeaders | undefined);
    if (!headers.has('User-Agent')) headers.set('User-Agent', this.getUserAgent());
    return await axios.get<T>(url, { ...config, headers });
  }

  async logError(error: ValidErrors, extraData: EmbedHelperField[] = []) {
    console.error(error);
    if (!this.discord.isClientOnline()) return;

    try {
      if (!this.config.logger.errorLogChannel) return;
      const channel = await this.discord.client.channels.fetch(this.config.logger.errorLogChannel);
      if (channel === null || !channel.isSendable()) {
        throw new PolyHelperError('Error logs channel could not be found');
      }
      const hasPermission = await canSendMessages(channel);
      if (!hasPermission) return;
      const owners = await getApplicationOwners(this.discord.client);
      await channel.send({
        content: getErrorTypeName(error) === 'Generic Error' ? owners.map((id) => `<@${id}>`).join(' ') : '',
        embeds: [getErrorEmbed(error, extraData)]
      });
    } catch (error) {
      console.error(error);
    }
  }

  private getGitCommit(): RuntimeInformation['commit'] {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      this.logError(toError(error));
      return 'UNKNOWN';
    }
  }

  private getGitDirty(): RuntimeInformation['dirty'] {
    try {
      return execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
    } catch (error) {
      this.logError(toError(error));
      return false;
    }
  }

  get startTime(): RuntimeInformation['startTime'] {
    return Math.floor(Date.now() / 1000) - Math.floor(process.uptime());
  }

  getRuntimeInformation(): RuntimeInformation {
    return { commit: this.getGitCommit(), dirty: this.getGitDirty(), startTime: this.startTime };
  }

  getUserAgent() {
    const runtime = this.getRuntimeInformation();
    return `${this.package.name}/g${runtime.commit} (github:Polyfrost/PolyHelper)`;
  }
}

export default Application;
