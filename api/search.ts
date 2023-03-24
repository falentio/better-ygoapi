import * as axios from "axios"
import uFuzzy from "@leeoniya/ufuzzy"
import * as liqe from "liqe"

const cardsPromise = axios
	.get("https://db.ygoprodeck.com/api/v7/cardinfo.php")
	.then(res => res.data.data)
const versionPromise = axios
	.get("https://db.ygoprodeck.com/api/v7/checkDBVersion.php")
	.then(res => res.data[0])
const uf = new uFuzzy({})

export default async function handler(req, res) {
	const cards = await cardsPromise
	const version = await versionPromise
	const name = req.query.name
	const filters = [req.query.filters].flat(1).filter(Boolean)
	const result = search(cards, name, filters)
	res
		.setHeader("cache-control", "public, max-age=3600")
		.setHeader("x-ygoprodeck-version", version.database_version)
		.setHeader("x-ygoprodeck-last-update", version.last_update)
		.status(200)
		.json(result)
}

function search(cards: any[], name: string, filters: string[] = []) {
	const cardNames = cards.map(c => c.name)
	const [idxs, info, order] = uf.search(cardNames, name)
	const parsedFilters = filters.map(str => {
		return liqe.parse(str)
	})
	const cardsMatched = order
		.slice(0, 10)
		.map(o => {
			return cards[info.idx[o]]
		})
		.filter(c => {
			return parsedFilters.every(f => liqe.test(f, c))
		})
	return cardsMatched
}