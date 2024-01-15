const { Schema, model: createModel, Types } = require("mongoose");
const MongoInventory = require("./MongoInventory");

const model = createModel("user", new Schema({
	userId: String,
	coins: Number,
	favorite: { type: Schema.Types.ObjectId, ref: "inventory" },
	cooldowns: {
		claim: Number,
		drop: Number,
		daily: Number,
		stream: Number,
        duel: Number
	},
	streaks: {
		daily: { type: Number, default: 0 }
	}
}, { timestamps: true }));

module.exports = class MongoUser {
	/**
	 * @param {string} userId 
	 */
	constructor(userId) {
		this.userId = userId;
		this.model = model;
		this.inventory = new MongoInventory(this.userId);
	}

	async get() {
		const data = await (await model.findOne({ userId: this.userId }) ?? await model.create({ userId: this.userId })).populate("favorite");
		return await data.populate("favorite.card");
	}

	/**
	 * @typedef {"drop" | "claim" | "daily" | "stream" | "duel"} CooldownType
	 */

	/**
	 * @param {CooldownType} cooldown 
	 * @param {number} duration 
	 */
	async setCooldown(cooldown, duration) {
		const $set = {};
		$set[`cooldowns.${cooldown}`] = Date.now() + duration;
		return model.findOneAndUpdate({ userId: this.userId }, { $set }, { new: true, upsert: true });
	}

	/**
	 * @param {Types.ObjectId} _id 
	 */
	setFavorite(_id) {
		return model.findOneAndUpdate({ userId: this.userId }, { $set: { favorite: _id }}, { upsert: true, new: true });
	}

	async getFavorite() {
		const data = await model.findOne({ userId: this.userId }).populate("favorite");
		return (await data.populate("favorite.card")).favorite;
	}

	/**
	 * @param {number} coins 
	 */
	async addCoins(coins) {
		const data = await this.model.findOneAndUpdate({ userId: this.userId }, { $inc: { coins }});
		return data;
	}
    
    /**
	 * @param {number} xp 
	 * @param {number} coins 
	 */
	async stream(xp, coins) {
		const data = await this.model.findOneAndUpdate({ userId: this.userId }, { $inc: { coins }}).populate("favorite");
		await this.addFavoriteXp(xp);
		return data;
	}
    
    async addFavoriteXp(xp) {
		const data = await this.get();
		return this.inventory.addXp(data.favorite._id, xp);
	}

	/**
	 * @param {number} coins
	 * @param {number} xp
	 * @param {Types.ObjectId} _id
	 */
	/**
	 * @param {number} coins
	 * @param {number} xp
	 * @param {Types.ObjectId} _id
	 */
	async login(coins, xp, _id) {
		const data = await this.get();
		const update = { $set: {}, $inc: {} };
		const result = { coins: null, streaks: null, xp: null, card: null, leveledUp: false };
		if (data.favorite.level == 0) data.favorite.level = 1;

		// If they are not within streak, reset
		if (data.cooldowns.daily + 8.64e+7 > Date.now()) {
			result.coins = data.streaks.daily >= 6 ? (coins * 7) : coins + (coins * (data.streaks.daily ?? 0));
			result.streaks = data.streaks.daily + 1;
			if (data.favorite && data.favorite.level < 20) result.xp = xp + (xp * (data.streaks.daily ?? 0));
			update.$inc["streaks.daily"] = 1;
			update.$inc.coins = result.coins;
		}
		else {
			result.coins = coins;
			result.streaks = 1;
			if (data.favorite.card && data.favorite.level < 20) result.xp = xp;
			update.$set["streaks.daily"] = 1;
			update.$inc.coins = coins;
		}

		// If there is a favorite card
		if (data.favorite && data.favorite.level < 20) {
			result.card = data.favorite.card;
			// Get the needed XP for the next level
			const neededXP = 100 + (data.favorite.level - 1) * 50;
			// If the amount of exp they have right now + the amount of exp they're about to get is more than the needed XP, get the remaining XP and level up
			if ((data.favorite.exp + result.xp) >= neededXP) result.leveledUp = true;
			await this.addFavoriteXp(result.xp);
		}

		await model.findOneAndUpdate({ userId: this.userId }, update, { new: true, upsert: true });
		this.inventory.add(_id);
		return result;
	}

	/**
	 * @param {CooldownType} cooldown 
	 */
	async getCooldown(cooldown) {
		const user = await this.get();
		return user.cooldowns[cooldown];
	}

}