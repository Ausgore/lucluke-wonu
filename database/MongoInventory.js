const { Schema, model: createModel, Types } = require("mongoose");

const model = createModel("inventory", new Schema({
	userId: String,
	card: { type: Schema.Types.ObjectId, ref: "card" },
	quantity: { type: Number, default: 0 },
	level: { type: Number, default: 1 },
	exp: { type: Number, default: 0 }
}));

module.exports = class MongoInventory {
	/**
	 * @param {string} userId 
	 */
	constructor(userId) {
		this.userId = userId;
		this.model = model;
	}

	/**
	 * @typedef {Object} InventoryFilterOptions
	 * @property {string} id
	 */

	/**
	 * @typedef {Object} InventoryOptions
	 * @property {InventoryFilterOptions} filter
	 * @property {any} sort
	 */

	/**
	 * @param {InventoryOptions} options
	 */
	async getAll(options) {
		let cards = await model.find({ userId: this.userId }).populate("card");
		if (options?.filter?.id) cards = cards.filter(i => i.card.id.startsWith(options.filter.id.toUpperCase()));
		return cards;
	}
    
    async getCopies() {
		const cards = await model.find({ userId: this.userId });
		return cards.reduce((a, b) => a + b.quantity, 0);
	}
 
	async addXp(_id, exp) {
		const data = await this.model.findOne({ _id });
		const neededXp = 100 + ((data.level - 1) * 50);
		if ((data.exp + exp) >= neededXp) {
			const remaining = (data.exp + exp) - neededXp;
			return model.findOneAndUpdate({ _id }, { $inc: { level: 1 }, $set: { exp: remaining }});
		} 
		return model.findOneAndUpdate({ _id }, { $inc: { exp }});
	}
    
    /**
	 * @param {string} userId 
	 * @param {Types.ObjectId} _id 
	 */
	async give(userId, _id) {
		const inventory = await this.get(_id);
		if (inventory.quantity > 0) {
			const mongo = new MongoInventory(userId);
			await mongo.add(_id);
			return await this.add(_id, -1);
		}
	}

	/**
	 * @param {Types.ObjectId} _id 
	 */
	async get(_id) {
		return model.findOne({ userId: this.userId, card: _id }).populate("card");
	}

	/**
	 * @param {Types.ObjectId} _id 
	 * @param {number} quantity
	*/
	async add(_id, quantity = 1) {
		return model.findOneAndUpdate({ userId: this.userId, card: _id }, { $inc: { quantity } }, { new: true, upsert: true });
	}
}