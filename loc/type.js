export function type_loc(origin, href, pathname, query, hash) {//, name, args) {
	return {
		origin,
		href,
		pathname,
//		name,
//		args,
//		param: {},
		query,
		hash: {
//			href: hash,
			path: hash.substr(1)
		}
	};
}
