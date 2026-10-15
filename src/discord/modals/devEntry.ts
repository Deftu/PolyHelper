import DiscordModal from '../private/modals/DiscordModal.ts';
import DiscordModalData from '../private/modals/DiscordModalData.ts';
import PolyHelperError from '../../private/error.ts';
import { InteractionFlags, type ModalMessageModalSubmitInteractionWithGuild } from '../../types/discord.ts';
import { getRepoCount } from '../../utils/githubAPIUtils.ts';
import { hasRole } from '../../utils/discordUtils.ts';

class DevEntryModal extends DiscordModal {
  override readonly data = new DiscordModalData('dev-entry');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildModal];

  override async execute(interaction: ModalMessageModalSubmitInteractionWithGuild) {
    if (await hasRole(interaction.member, this.discord.application.config.discord.roles.devAccess)) {
      throw new PolyHelperError('You already have access to the Development channels');
    }

    const userAnswer = parseInt(interaction.fields.getTextInputValue('repo-count'));
    const answer = await getRepoCount();

    if (userAnswer !== answer) {
      await interaction.followUp({ content: 'Your answer was incorrect. Try again.' });
      return;
    }

    await interaction.member.roles.add(
      this.discord.application.config.discord.roles.devAccess,
      'User parsed the dev entry question'
    );
    await interaction.followUp({ content: 'You should now have access to the Development channels.' });
  }
}

export default DevEntryModal;
