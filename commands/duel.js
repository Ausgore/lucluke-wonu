const { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const MongoUser = require("../database/MongoUser");
const MongoCard = require("../database/MongoCard");
const { promises: fs } = require("fs");
const config = require("../config");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("duel")
		.setDescription("Duel with a random card!"),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	run: async (interaction) => {
		const mongoUser = new MongoUser(interaction.user.id);
		const favorite = await mongoUser.getFavorite();
		if (!favorite) return interaction.reply({ content: "You hadn't set a favorite card to duel with yet.", ephemeral: true });

		const cooldown = await mongo.getCooldown("duel");
		if (cooldown > Date.now()) {
			embed
				.setTitle("This command is on cooldown!")
				.setDescription(`**Total cooldown:** ${config.cooldowns.duel / 60000} minutes\n**Time remaining:** ${humanize(cooldown - Date.now(), { delimiter: " and ", round: true }).replace(/\d+/g, n => `\`${n}\``)}`);
			return interaction.reply({ embeds: [embed], ephemeral: true });
		}
		mongo.setCooldown("stream", config.cooldowns.duel);

		await interaction.deferReply();

		const card = await new MongoCard().getDuelCard(favorite.card.tier);

		let chance;
		if (card.tier == "Common") chance = 50;
		else if (card.tier == "Uncommon") chance = 40;
		else if (card.tier == "Super") chance = 30;
		else if (card.tier == "Rare") chance = 20;
		else chance = 10;
		if (favorite.level >= 6 && favorite.level < 10) chance += 10;
		else if (favorite.level >= 10 && favorite.level < 15) chance += 20;
		else if (favorite.level >= 15 && favorite.level < 20) chance += 30;
		else if (favorite.level >= 20) chance += 40;

		const buffer = await fs.readFile(`images/${card.id}.png`);
		const image = new AttachmentBuilder(buffer, { name: "image.png" });

		const scenario = config.scenarios[Math.floor(Math.random() * config.scenarios.length)];
		scenario.text = scenario.text
			.replace(/{card}/g, card.name)
			.replace(/{fav}/g, favorite.card.name)
			.replace(/{tier}/g, config.tiers[card.tier].emoji);
		scenario.win = scenario.win
			.replace(/{card}/g, card.name)
			.replace(/{fav}/g, favorite.card.name)
			.replace(/{tier}/g, config.tiers[card.tier].emoji);
		scenario.lose = scenario.lose
			.replace(/{card}/g, card.name)
			.replace(/{fav}/g, favorite.card.name)
			.replace(/{tier}/g, config.tiers[card.tier].emoji);

		const buttons = new ActionRowBuilder().setComponents(
			new ButtonBuilder().setCustomId("help").setLabel("help him!").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId("run").setEmoji("1152129877743501346").setStyle(ButtonStyle.Secondary));
		
		const embed = new EmbedBuilder()
			.setColor(config.theme)
			.setDescription(`<:wonu_message:1152925615486418964> ${scenario.text}`)
			.setImage("attachment://image.png");
		const message = await interaction.editReply({ embeds: [embed], files: [image], fetchReply: true, components: [buttons] });
		
		const i = await message.awaitMessageComponent({ filter: i => i.user.id == interaction.user.id, time: 15_000 }).catch(() => null);
		if (!i) {
			embed.setDescription("You took too long!");
			return interaction.editReply({ embeds: [embed], components: [] });
		}
		await i.deferUpdate();

		if (i.customId == "help") {
			const odds = Math.floor(Math.random() * 100);
			if (odds <= chance) embed.setColor("Green").setDescription(scenario.win);
			else embed.setColor("Orange").setDescription(scenario.lose);
			interaction.editReply({ embeds: [embed], components: [] });
		}
		else if (i.customId == "run") {
			embed.setDescription(`You and __${favorite.card.name}__ ran away from **${card.name}** successfully!`);
			interaction.editReply({ embeds: [embed], components: [] });
		}
	}
}