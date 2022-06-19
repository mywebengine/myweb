export default function del(obj, prop) {
	const val = obj[prop];
	delete obj[prop];
	return val;
}
