module.exports = {
	theme: "#9966cc",
	token: "MTE3MTc5MzM4NDkxOTI3NzYxOA.G9reTM._mZIg8QtYzxSdk-tAtrSkAvHkY1wKS49shmBNY",
	connection: "mongodb+srv://wonugamelounge:wonulucnmyles025@wonu.kxc6s4b.mongodb.net/",
	// connection: "mongodb+srv://glenn:glnn3444@database.nyy8c.mongodb.net/",
	cooldowns: {
		drop: 600_000,
		claim: 300_000,
        stream: 1.08e+7,
        duel: 7.2e+6
	},
    
	cardWidth: 534,
	cardHeight: 801,

    // For drop command
    // Make sure the total value of all "chance" is equal to 1
	tiers: {
		Common: {
			emoji: "<:common:1150542813004566659>",
			chance: 0.50
		},
		Uncommon: {
			emoji: "<:uncommon:1150542862790959104>",
			chance: 0.35
		},
		Super: {
			emoji: "<:uncommon:1150542862790959104>",
			chance: 0
		},
		Rare: {
			emoji: "<:rare:1150542942218494052>",
			chance: 0
		},
		UltraRare: {
			emoji: "<:ultra_rare:1150542981397491773>",
			chance: 0
		},
		Event: {
			emoji: "<:event:1173621318298636298>",
			chance: 0.10
		},
		Limited: {
			emoji: null,
            chance: 0.05
		},
		Boosted: {
			emoji: null
		},
		Staff: {
			emoji: "<:staff:1173621434208231504>"
		},
		Birthday: {
			emoji: null
		}
    },
    
    // For duel command
	duel: {
		// All tiers within the "Common" tier will be droppable
		// Make sure that they total to 1
		Common: {
			Uncommon: 0.85,
			Event: 0.1,
			Limited: 0.05
		},
		Uncommon: {
			Uncommon: 0.8,
			Event: 0.13,
			Limited: 0.07
		},
		Super: {

		},
		Rare: {

		},
		UltraRare: {

		},
		Event: {
			Event: 0.9,
			Limited: 0.1
		},
		Limited: {
			Event: 0.9,
			Limited: 0.1
		},
		Boosted: {

		},
		Staff: {
			Event: 0.9,
			Limited: 0.1
		},
		Birthday: {
			
		}
	},
	scenarios: [
		{
			text: "You and {fav} go on a walk! On the walk, a bush starts rustling.. getting closer **{card}** {tier} pops out!",
			win: "You give **{card}** a pat on the head. **{card} enjoys your presence and joins you and __{fav}__ on your walk!",
			lose: "**{card} got shy and ran away! __{fav}__ lost a new friend :(",
		},
		{
			text: "You and __{fav}__ were blowing bubbles! __{fav}__ notices **{card}** {tier} watching from a far . . .", 
			win: "You ask if they want to play with you. **{card}** said yes and blew bubbles with you!",
			lose: "**{card}** stole __{fav}__ bubbles and ran away! You shared your bubbles with __fav__",
		},
		{
			text: "You and {fav} come back from the market when you see **{card}** whos stuck in a tree . . .",
			win: "You and {fav} help **{card}** out the tree, in return they became your friend!",
			lose: "You and {fav} help **{card}** out the tree! **{card}** was too embarassed and ran away :("
		},
		{
			text: "You and {fav} go to the beach to play volleyball! On your journey, **{card}** stops you . . .",
			win: "You ask **{card}** if he wants to join you! He says yes! <3",
			lose: "**{card}** steals your volleyball! Oh no! No more volleyball :("
		},
		{
			text: "You and {fav} go to a flower shop! Looking through all the flowers, you spot someone peeking out of the flowers. It's **{card}** {tier} ! and they're stealing the flowers . . .",
			win: "You got **{card}** to give you their flowers! In return, you became their friend!",
			lose: "**{card}** ran off with the flowers! All the daisies are gone :("
		}
	]
}