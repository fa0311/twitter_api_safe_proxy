const response = await fetch("http://127.0.0.1:3000/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet", {
	headers: {
		accept: "*/*",
		"accept-language": "ja,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
		authorization:
			"Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
		"cache-control": "no-cache",
		"content-type": "application/json",
		pragma: "no-cache",
		priority: "u=1, i",
		"sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
		"sec-ch-ua-mobile": "?0",
		"sec-ch-ua-platform": '"Windows"',
		"sec-fetch-dest": "empty",
		"sec-fetch-mode": "cors",
		"sec-fetch-site": "same-origin",
		"x-client-transaction-id":
			"zgXM/UeWsKZafDam2yaYo7MPw61UzUsw5s6QpZPQH7x/9cHfTVJ74uChvusP4dNt/HHYZssCi5Qe2A2m0lrdttRybY6lzQ",
		"x-csrf-token":
			"8b6db7acf49a258b94afc3375de405419f256696a5911ea8ef468509e990dd051629a6dbb030508c2e8b098a6e72130e2d282522a1083ce04a11e0e99ebbf3ce275763f7e7d9c73d812ce7e10296484a",
		"x-twitter-active-user": "yes",
		"x-twitter-auth-type": "OAuth2Session",
		"x-twitter-client-language": "ja",
	},
	referrer: "https://x.com/nanochie_12_10/status/2050851334958829993",
	body: '{"variables":{"tweet_id":"2050851334958829993"},"queryId":"lI07N6Otwv1PhnEgXILM7A"}',
	method: "POST",
	mode: "cors",
	credentials: "include",
});

console.log(await response.json());
