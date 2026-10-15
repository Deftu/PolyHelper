import { CommandPermission, type DiscordManagerWithClient, InteractionFlags } from '../../types/discord.ts';
import type DiscordManager from '../DiscordManager.ts';

abstract class BasicInteractionData<Manager extends DiscordManager = DiscordManagerWithClient> {
  readonly permission: CommandPermission = CommandPermission.Anyone;
  readonly flags: readonly InteractionFlags[] = [];
  constructor(protected readonly discord: Manager) {}
}

export default BasicInteractionData;
