import { serve } from "https://deno.land/std/http/server.ts"
import uFuzzy from "https://esm.sh/@leeoniya/ufuzzy@1.0.6"
import * as liqe from "https://cdn.skypack.dev/liqe@3"
import c from "./ygo.json" assert { type: "json" }

let cards = c.data
const uf = new uFuzzy({

})

if (!!Deno.env.get("FETCH_CARD")) {
	const res = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php")
	const { data } = await res.json()
	cards = data
}

serve(req => {
	const url = new URL(req.url)
	while (url.pathname.endsWith("/")) {
		url.pathname = url.pathname.slice(0, -1)
	}
	switch (url.pathname) {
		case "/":
			return Response.redirect("https://github.com/falentio/better-ygoapi")
		case "/search":
			const name = url.searchParams.get("name")
			const filters = url.searchParams.getAll("filters")
			const cards = search(name, filters)
			return json(cards)
	}
})

function json(body: unknown, init: ResponseInit = {}) {
	const h = init.headers = new Headers(init.headers || {})
	h.set("content-type", "application/json")
	return new Response(JSON.stringify(body), init)
}

function search(name: string, filters: string[] = []) {
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