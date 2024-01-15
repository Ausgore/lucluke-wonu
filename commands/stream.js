const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const MongoUser = require("../database/MongoUser");
const config = require("../config");
const humanize = require("humanize-duration");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stream")
		.setDescription("Stream every 3 hours to earn coins!"),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	run: async (interaction) => {
        try { await interaction.deferReply() } catch (msg) {
          console.log("stream.js - Interaction already acknowledged: " + msg);  
        };
        
		const mongo = new MongoUser(interaction.user.id);
		const embed = new EmbedBuilder().setColor(config.theme);

        if (interaction.user.id != "870214177732558879") {
        	const cooldown = await mongo.getCooldown("stream");
            if (false && cooldown > Date.now()) {
                embed
                    .setTitle("This command is on cooldown!")
                    .setDescription(`**Total cooldown:** \`${config.cooldowns.stream / 60000}\` minutes\n**Time remaining:** ${humanize(cooldown - Date.now(), { delimiter: " and ", round: true }).replace(/\d+/g, n => `\`${n}\``)}`);
                return interaction.editReply({ embeds: [embed], ephemeral: true });
            }
            mongo.setCooldown("stream", config.cooldowns.stream);   
        }

		const favorite = await mongo.getFavorite();
		if (!favorite) return interaction.editReply({ content: "Set a favorite card first before using this command." });

		let reward;
		const rewards = [125, 250, 500, 750];
		const probabilites = {
			Common: [40, 30, 20, 10],
			Uncommon: [30, 35, 25, 10],
			Super: [20, 30, 35, 15],
			Rare: [15, 25, 35, 25],
			UltraRare: [10, 20, 40, 30]
		};
        
		const random = Math.random() * 100;
		let cumulativeProbability = 0;
		for (let i = 0; i < 4; i++) {
            if (probabilites[favorite.card.tier]) cumulativeProbability += probabilites[favorite.card.tier][i];
            else cumulativeProbability += probabilites.Common[i]
			if (random < cumulativeProbability) {
				reward = rewards[i];
				break;
			}
		}

		if (favorite.level >= 2 && favorite.level <= 5) reward += 50;
		else if (favorite.level >= 6 && favorite.level <= 10) reward += 100;
		else if (favorite.level >= 11 && favorite.level <= 15) reward += 150;
		else if (favorite.level >= 16 && favorite.level <= 20) reward += 200;

		await mongo.stream(20, reward);
		embed.setDescription(`<:wonu_comp:1152129777055039529> ${favorite.card.name} streamed and earned ${reward} <:wonu_coins:1146974432389234768>!\n${favorite.card.name} also got 20 experience from streaming. congrats!`)
		return interaction.editReply({ embeds: [embed] });
	}
}