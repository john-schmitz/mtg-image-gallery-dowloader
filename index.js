const throttledQueue = require("throttled-queue");
const jsonfile = require("jsonfile");
const fetch = require("node-fetch");
const fs = require("fs");
const finalPath = "./cardImages"
const file = "./res/AllCards.json";
const unsets = ["UST", "UNH", "UGL"];

function intersection(arr1, arr2) {
	return arr1.some(r => arr2.includes(r));
}

async function boot() {
	const throttle = throttledQueue(10, 1000, true);
	const obj = await jsonfile.readFile(file);
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const card = obj[key];
			
			if (intersection(card.printings, unsets)) {
				continue;
			}
			const nomeCarta = card.name.replace(/\([a-z]\)/, "").replace(/ $/, "").replace(" // ", "");
			throttle(() => {
				fs.access(`${finalPath}/${nomeCarta}.full.jpg`, fs.constants.F_OK, async (err) => {
					if (err) {
						try {
							let res = await fetch("https://api.scryfall.com/cards/named?exact=" + nomeCarta);
							let cardObject = await res.json()
							let imageUrl;

							if(cardObject.image_uris) {
								imageUrl = cardObject.image_uris.border_crop;
							} else if (cardObject.card_faces) {
								imageUrl = cardObject.card_faces[0].image_uris.border_crop;
							}

							fetch(imageUrl).then(res => {
								console.log("baixado ", cardObject.name);
								const dest = fs.createWriteStream(`${finalPath}/${cardObject.name.replace(/"/g, "").replace(" // ", "").replace(/\?/g, "")}.full.jpg`);
								res.body.pipe(dest);
							}).catch(err => {
								console.log(err);
							});
						} catch (error) {
							console.log("Error ", nomeCarta);
						}
					}
				});
			});
		}
	}
}
boot();