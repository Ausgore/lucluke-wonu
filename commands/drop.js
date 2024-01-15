const { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require("discord.js");
const config = require("../config");
const MongoCard = require("../database/MongoCard");
const { promises: fs } = require("fs");
const MongoInventory = require("../database/MongoInventory");
const MongoUser = require("../database/MongoUser");
const humanize = require("humanize-duration");
const sharp = require("sharp");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("drop")
		.setDescription("Drop a set of 3 cards")
		.setDMPermission(false),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	run: async (interaction) => {
		const gap = 10;
        
        if (interaction.user.id != "870214177732558879") {
            const mongoUser = new MongoUser(interaction.user.id);
        	const cooldown = await mongoUser.getCooldown("drop");
            if (false && cooldown > Date.now()) {
                embed
                    .setTitle("This command is on cooldown!")
                    .setDescription(`**Total cooldown:** \`${config.cooldowns.drop / 60000}\` minutes\n**Time remaining:** ${humanize(cooldown - Date.now(), { delimiter: " and ", round: true }).replace(/\d+/g, n => `\`${n}\``)}`);
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
            mongoUser.setCooldown("drop", config.cooldowns.drop);   
        }
        
        await interaction.deferReply();
        
		const embed = new EmbedBuilder()
			.setColor(config.theme)
			.setDescription(`${interaction.user} is dropping a set of 3 cards!`);

		const mongo = new MongoCard();
		const cards = await mongo.getCards(3);

		const component = new ActionRowBuilder().setComponents(
			new ButtonBuilder().setCustomId(`${cards[0].id}-1`).setEmoji("1153061555232055377").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`${cards[1].id}-2`).setEmoji("1153061572957184072").setStyle(ButtonStyle.Secondary),
			new ButtonBuilder().setCustomId(`${cards[2].id}-3`).setEmoji("1153061605530148954").setStyle(ButtonStyle.Secondary));

		const compositePromiseArray = cards.map(async (card, index) => {
			const buffer = await fs.readFile(`images/${card.id}.png`).catch(() => null);
			const resizedBuffer = await sharp(buffer).resize(config.cardWidth, config.cardHeight).toBuffer();
			return { input: resizedBuffer, left: index * (config.cardWidth + gap), top: 0 }
		});

		const compositeImage = sharp({ create: { 
			width: (config.cardWidth + gap) * 3 - gap,
			height: config.cardHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}}).composite(await Promise.all(compositePromiseArray)).png();

		const buffer = await compositeImage.toBuffer();

		const attachment = new AttachmentBuilder(buffer, { name: "image.png" });
		embed.setImage("attachment://image.png");
		const message = await interaction.editReply({ embeds: [embed], files: [attachment], components: [component], fetchReply: true });

		const collected = new Collection();
		const collector = message.createMessageComponentCollector({ time: 30_000 });
		collector.on("collect", async i => {
            await i.deferReply({ ephemeral: true });
			if (Date.now() - i.createdTimestamp <= 15_000 && i.user.id != interaction.user.id)
				if (![...collected.values()].includes(interaction.user.id)) return i.editReply("You cannot claim a card within the first 15 seconds before the command executor claimed theirs.");

			const customId = i.customId.split("-")[0];
			const mongo = new MongoUser(i.user.id);
			if ([...collected.values()].includes(i.user.id))
				return i.editReply("You already claimed a card.");

			if (collected.get(i.customId))
				return i.editReply("Someone else already claimed this card.");

			const cooldown = await mongo.getCooldown("claim");
			if (cooldown > Date.now()) 
				return i.editReply({ content: `You need to wait for ${humanize(cooldown - Date.now(), { delimiter: " and ", round: true }).replace(/\d+/g, n => `\`${n}\``)} before claiming a card!`, ephemeral: true });
			mongo.setCooldown("claim", config.cooldowns.claim);

			collected.set(i.customId, i.user.id);
			component.components.find(c => c.data.custom_id == i.customId).setDisabled(true);
			message.edit({ components: [component] });

			new MongoInventory(i.user.id).add(cards.find(c => c.id == customId)._id);
			let card = cards.find(c => c.id == customId);
			i.editReply(`You've picked up *${card.name}*!`);
		});
		collector.once("end", async () => {
			component.components.forEach(c => c.setDisabled(true));
			component.addComponents(new ButtonBuilder().setCustomId("nil").setLabel("This drop has expired").setStyle(ButtonStyle.Secondary).setDisabled(true));
			message.edit({ components: [component] });

			embed
				.setTitle("GAME OVER")
				.setDescription(cards.map((card, i) => `${i + 1}. __${card.name}__ [${card.era}] // ${card.id} ${config.tiers[card.tier]?.emoji}\nGroup : ${card.group}\nClaimed by ${collected.get(`${card.id}-${i+1}`) ? `<@${collected.get(`${card.id}-${i+1}`)}>` : "no one."}`).join("\n\n"))
			interaction.followUp({ embeds: [embed] });
		});
	}
}