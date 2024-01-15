const { Schema, model: createModel } = require("mongoose");
const { promises: fs } = require("fs");
const { AttachmentBuilder } = require("discord.js");
const MongoInventory = require("./MongoInventory");
const config = require("../config");
const shuffle = require("shuffle-array");
const sharp = require("sharp");

const model = createModel("card", new Schema({
	id: String,
	name: String,
	group: String,
	era: String,
	tier: String,
	droppable: Boolean
}));

module.exports = class MongoCard {
	constructor() {
		this.model = model;
	}

	/**
	 * @typedef {Object} Card
	 * @property {string} id
	 * @property {string} name
	 * @property {string} group
	 * @property {string} era
	 * @property {string} tier
	 * @property {boolean} droppable
	 */

	/**
	 * @param {string} id
	 * @param {boolean} withImage 
	 */
	async get(id, withImage) {
		const data = await model.findOne({ id });
		if (!data) return null;
		if (withImage) {
			const buffer = await fs.readFile(`images/${id}.png`);
			data.attachment = new AttachmentBuilder(buffer, { name: `${id}.png` });	
		}
		return data;
	}
    
    /**
	 * @param {string} tier The favorite card's tier
	 */
	async getDuelCard(tier)
	{
		const existingTiers = await model.distinct("tier", { droppable: true });
		
		const chances = config.duel[tier];
		if (!chances) return;
		const allTiers = Array.from(Object.keys(chances));
		const availableTiers = allTiers.filter(t => existingTiers.includes(t) && chances[t]);
		let availableTierChances = availableTiers.map(t => chances[t]);

		if (allTiers.length != availableTiers.length) {
			const unavailableTiers = allTiers.filter(t => !availableTiers.includes(t));
			const totalUnavailableTierChance = Number(unavailableTiers.map(t => chances[t]).filter(c => c).reduce((a, b) => a + b, 0)).toFixed(5);
			availableTierChances = availableTierChances.map(c => c + (totalUnavailableTierChance / availableTiers.length));
		}

		const chosenTier = availableTiers[this.getIndexBasedOnChance(availableTierChances)];
		const count = await model.countDocuments({ tier: chosenTier });
		const randomIndex = Math.floor(Math.random() * count);

		const card = await model.findOne({ tier: chosenTier }).skip(randomIndex).limit(1);
		return card;
	}

	/**
	 * @param {number} quantity Default is 1
	 */
	/**
	 * @param {number} quantity Default is 1
	 */
	async getCards(quantity = 1) {
        const existingTiers = await model.distinct("tier", { droppable: true });

		const allTiers = Array.from(Object.keys(config.tiers));
		const availableTiers = allTiers.filter(t => existingTiers.includes(t) && config.tiers[t].chance);
		let availableTierChances = availableTiers.map(t => config.tiers[t].chance);
		

		// This will be responsible for going through each available tier's chance, and adding
		// The calculation would be the total chance of unavailable tier chance divided by the number of available tiers
		if (allTiers.length != availableTiers.length) {
			const unavailableTiers = allTiers.filter(t => !availableTiers.includes(t));
			const totalUnavailableTierChance = Number(unavailableTiers.map(t => config.tiers[t].chance).filter(c => c).reduce((a, b) => a + b, 0)).toFixed(5);
			availableTierChances = availableTierChances.map(c => c + (totalUnavailableTierChance / availableTiers.length));
		}

		const result = [];
		for (let i = 0; i < quantity; i++) {
			const tier = availableTiers[this.getIndexBasedOnChance(availableTierChances)];

			const count = await model.countDocuments({ tier });
			const randomIndex = Math.floor(Math.random() * count);

			const card = await model.findOne({ tier }).skip(randomIndex).limit(1);
			result.push(card);
		}
		return result;
	}
    
    /**
	 * Responsible for getting the random chance in the array
	 * @param {number[]} array The array of chances 
	 */
	getIndexBasedOnChance(array) {
		const random = Math.random();
		let cumulativeProbability = 0;
		for (let i = 0; i < array.length; i++) {
			cumulativeProbability += array[i];
			if (random <= cumulativeProbability) return i;
		}
	}

	/**
	 * @param {string} id 
	 * @param {Card} card 
	 */
	async update(id, card) {
		return model.findOneAndUpdate({ id }, { $set: card });
	}

	/**
	 * @param {string} id 
	 */
	async delete(id) {
		fs.unlink(`images/${id}.png`).catch(() => null);
		const card = await model.findOneAndDelete({ id });
        if (card) await new MongoInventory().model.deleteMany({ card: card._id });
		return card;
	}

	/**
	 * @param {Card} card 
	 */
	async create(card) {
		const compressedBuffer = await sharp(card.buffer)
			.resize({ width: config.cardWidth, height: config.cardHeight })
			.png({ compressionLevel: 9, quality: 70 })
			.toBuffer();
		fs.writeFile(`images/${card.id}.png`, compressedBuffer);
		card.attachment = new AttachmentBuilder(card.buffer, { name: `${card.id}.png` });
		delete card.buffer;
		return model.create(card);
	}
}