const d = {};
d.isShow = false;
d.isShow2 = 1;
d.arr = [];
d.arr2 = [];
d.red = 'red';
d.green = 'cyan';
for (let i = 0; i < 2; i++) {
	d.arr.push({
		name: i + 1
	});
	d.arr2.push(i);
}
export default d;
