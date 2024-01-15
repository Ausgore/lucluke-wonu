const { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const MongoInventory = require("../database/MongoInventory");
const config = require("../config");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("donate")
		.setDescription("Gift card(s) to another user")
		.addUserOption(opt => opt.setName("user").setDescription("The user to donate").setRequired(true))
		.addStringOption(opt => opt.setName("card1").setDescription("The first card's id").setRequired(true).setAutocomplete(true))
		.addStringOption(opt => opt.setName("card2").setDescription("Another card's id").setAutocomplete(true))
		.addStringOption(opt => opt.setName("card3").setDescription("Another card's id").setAutocomplete(true))
		.addStringOption(opt => opt.setName("card4").setDescription("Another card's id").setAutocomplete(true))
		.addStringOption(opt => opt.setName("card5").setDescription("Another card's id").setAutocomplete(true)),
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	run: async (interaction) => {
		const message = await interaction.deferReply({ fetchReply: true });
		const user = interaction.options.getUser("user");
        if (interaction.user.id == user.id) return interaction.editReply({ content: "You can't donate to yourself.", ephemeral: true });

		const ids = interaction.options.data.filter(d => d.type == 3 && d.value).map(d => d.value);

		const mongo = new MongoInventory(interaction.user.id);
		const inventory = await mongo.getAll()
		const cards = inventory.filter(c => ids.includes(c.card.id));
		
		const buttons = new ActionRowBuilder().setComponents(
			new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Secondary));

		const embed = new EmbedBuilder()
			.setColor(config.theme)
			.setTitle("Are you sure?")
			.setDescription(`Are you sure you want to donate\n${cards.map(c => `${c.card.name} [${c.card.era}] ${config.tiers[c.card.tier].emoji}`).join("\n")}\nto ${user}?`);
		await interaction.editReply({ embeds: [embed], components: [buttons] });

		const option = await message.awaitMessageComponent({ filter: i => i.user.id == interaction.user.id });
		await option.deferUpdate();
		if (!option || option.customId == "no") { 
			embed.setColor("Red").setTitle("Donate").setDescription("Transaction was cancelled.");
			return interaction.editReply({ embeds: [embed], components: [] });
		}

		for (const card of cards) await mongo.give(user.id, card.card._id);

		embed
			.setTitle(null)
			.setDescription(`${interaction.user} donated ${user} ${cards.length == 1 ? "a card" : "cards"}!\n\n${cards.map(c => `${c.card.name} [${c.card.era}] ${config.tiers[c.card.tier].emoji}`).join("\n")}`);
		return interaction.editReply({ embeds: [embed], components: [] });
	},
	/**
	 * @param {AutocompleteInteraction} interaction
	 */
	autocomplete: async (interaction) => {
		const { name }  = interaction.options.getFocused(true);
		const values =  interaction.options.data.filter(d => d.type == 3 && d.name != name).map(d => d.value);

		const mongo = new MongoInventory(interaction.user.id);
		const cards = await mongo.getAll();

		let filter = cards.filter(c => !values.includes(c.card.id) && c.quantity > 0).map(c => ({ name: c.card.id, value: c.card.id }));
		if (filter.length > 25) filter = filter.slice(0, 25);

		await interaction.respond(filter);
	}
}