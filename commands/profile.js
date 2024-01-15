const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const config = require("../config");
const MongoUser = require("../database/MongoUser");
const { format } = require("date-fns");
const { promises: fs } = require("fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Show off your profile!")
		.addUserOption(opt => opt.setName("user").setDescription("The user's profile to show"))
		.setDMPermission(false),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	run: async (interaction) => {
		await interaction.deferReply();

		const member = interaction.options.getMember("user") ?? interaction.member;
		const mongo = new MongoUser(member.id)
		const data = await mongo.get();
		const copies = await mongo.inventory.getCopies();

		const firstEmbed = new EmbedBuilder()
			.setColor(config.theme)
			.setImage("https://cdn.discordapp.com/attachments/1170686332801126470/1185106154578268191/IMG_4086.jpg?ex=658e671d&is=657bf21d&hm=6e93000a6a1941b31e7ea8d46edd9e96315a9b19aff05fdbb4d4803cfa13eb7b&");

		const buffer = await fs.readFile(`images/${data.favorite.card.id}.png`);
		const cardImage = new AttachmentBuilder(buffer, { name: "image.png" });

		const secondEmbed = new EmbedBuilder()
			.setColor(config.theme)
			.setDescription(`<:wonu_friends:1152129841383084062> ${member}'s profile\n<:wonu_note:1152233938455105699> Date Started : ${format(new Date(member.joinedTimestamp), "MMMM do yyyy, h:mma")}\n<:wonu_files:1152129823188209675> Total Cards Collected : ${copies}\n${data.favorite.card ? `<:wonu_diamond:1151257682444042290> Favorite Card : ${data.favorite.card.name} [${data.favorite.card.era}] // ${data.favorite.card.id} ${config.tiers[data.favorite.card.tier].emoji}` : ""}\n<:wonu_ds:1152129799964336208> Level : ${data.favorite.level}\n<:wonu_heart:1152926357102264360> Exp : ${data.favorite.exp}/${100 + (data.favorite.level - 1) * 50}`)
			.setImage("attachment://image.png");
		interaction.editReply({ embeds: [firstEmbed, secondEmbed], files: [cardImage] });
	}
}