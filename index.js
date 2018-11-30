const throttledQueue = require("throttled-queue");
const throttle = throttledQueue(1, 200);
const fs = require("fs");

const fetch = require("node-fetch");

const jsonfile = require("jsonfile");
const file = "./res/AllSets.json";


async function boot() {
	const listaCartas = [];
	jsonfile.readFile(file)
		.then((obj) => {
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					const set = obj[key];
					if (set.baseSetSize === 0) {
						continue;
					}
					for (let i = 0; i < set.cards.length; i++) {
						const card = set.cards[i];
						const nomeCarta = card.name.replace(/\([a-z]\)/, "");
						if (!listaCartas.includes(nomeCarta)) {
							listaCartas.push(nomeCarta);
						}
					}

				}

			}
			for (let i = 0; i < listaCartas.length; i++) {
				const nomeCarta = listaCartas[i];
				throttle(() => {
					if (!fs.existsSync(`./cardImages/${nomeCarta}.full.jpg`))
						fetch("https://api.scryfall.com/cards/named?exact=" + nomeCarta).then((res) => {
							console.log("baixado", nomeCarta);
							return res.json();
						}).then((carta) => {
							const imageUrl = carta.image_uris.border_crop;
							fetch(imageUrl).then(res => {
								const dest = fs.createWriteStream(`./cardImages/${carta.name}.full.jpg`);
								res.body.pipe(dest);
							});
						}).catch((err) => {
							console.log(err);
						});
				});
			}
		})
		.catch(error => console.error(error));

}


boot();