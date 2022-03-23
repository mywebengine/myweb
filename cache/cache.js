import {get$first, getNextStr} from "../descr/descr.js";

export function getCacheSrcId($i, str) {
//todo если _for1 _for2 - кэш будет браться для for2 c первого элемента
	const srcBy$src = my.env.srcBy$src,
		src = srcBy$src.get($i);
//todo
if (src === undefined) {
//Такое было с filling - так как запуск через таймер и что-то могло удалится. Нужно защетиться от всех подобных ситуаций.
	console.warn("2323", $i, str);
//debugger
	return 0;
}
	const descr = src.descr;
	if (descr.asOnes === null || !descr.asOnes.has(str)) {
		return src.id;
	}	
	const nStr = getNextStr(src, str);
	$i = get$first($i, descr.get$elsByStr, nStr);
	do {
		const iSrc = srcBy$src.get($i);
		if (iSrc !== undefined && iSrc.isCmd) {
			return iSrc.id;
		}
		$i = $i.nextSibling;
	} while ($i !== null);
//todo
	throw new Error("getCacheSrcId");
}
