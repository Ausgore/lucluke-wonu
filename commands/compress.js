const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const MongoCard = require("../database/MongoCard");
const { promises: fs } = require("fs");
const sharp = require("sharp");

module.exports = {
	data: new SlashCommandBuilder()
	.setName("compress")
	.setDescription("handlefiles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false),
	run: async (interaction) => {
		if (!["597912132092297216", "870214177732558879", "834388616133214211"].includes(interaction.user.id)) return interaction.reply({ content: "Only developers can run this command.", ephemeral: true });

		await interaction.reply("Compressing all card images, this may take awhile...");
		const cards = await new MongoCard().model.find();
		
		let deletedCards = "";
		for (let i = 0; i < cards.length; i++) {
			const card = cards[i];
			const stats = await fs.lstat(`images/${card.id}.png`).catch(() => null);
			if (!stats) {
                console.log(`${card.id} image does not exist, deleting from database`);
                await new MongoCard().delete(card.id);
                deletedCards += `${card.id}, `;
            }
			else {
                const filesize = stats?.size / 1024;
                console.log(`Checking ${card.id} ${filesize.toFixed(2)}kb (${i + 1} / ${cards.length})`);
                if (filesize > 1024) {
					const buffer = await fs.readFile(`images/${card.id}.png`).catch(() => null);
					const compressedBuffer = await sharp(buffer).png({ compressionLevel: 9, quality: 70 }).toBuffer();
					await fs.writeFile(`images/${card.id}.png`, compressedBuffer);
					await interaction.channel.send(`Compressed ${card.id}...`);
				}
            } 
		}
		await interaction.followUp(`All card images have been compressed.\n${deletedCards.length ? `Following have been deleted in the database as their image can't be found:\n${deletedCards}` : ""}`);
	}
}