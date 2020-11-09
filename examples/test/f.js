function c() {
	console.time(1);
	data.green = data.green === "green" ? "blue" : "green";
}
function s(v) {
	console.time(1);
	data.isShow = v;
}
function s2(v) {
	console.time(1);
	data.isShow2 = v;
}
function u(v) {
	console.time(1);
//console.time("set");
	data.arr.unshift(v);
//console.timeEnd("set");
}
function p(v) {
	console.time(1);
	data.arr.push(v);
}
function i() {
	console.time(1);
	data.arr[0].name = 0;
}
function f() {
	console.time(1);
	data.f = !data.f;
}