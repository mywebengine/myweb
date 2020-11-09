const data = {};
data.isShow = false;
data.isShow2 = 1;
data.arr = [];
data.arr2 = [];
data.f = false;

//data.a = {
//	arr: data.arr
//};

data.red = 'red';
data.green = 'cyan';

//for (let i = 0; i < 1000; i++) {
//	d['a' + i] = Math.random();
//}

data.p = new Promise(r => {
	self.pr = r;
});

for (let i = 0; i < 1000; i++) {
	data.arr.push({
//		name: {last: 'r' + i}
		name: 'r' + i
	});
	data.arr2.push(Math.random());
}

export default self.data = data;

self.addEventListener("start", () => {
	console.time(1);
});
self.addEventListener("render", evt => {
	console.timeEnd(1);
//	console.log(evt.detail.srcIdSet);
});
