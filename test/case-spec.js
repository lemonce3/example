const { Master, utils } = require('@lemonce3/interface');
const Native = require('@lemonce3/interface/interface/native');
const assert = require('assert');

Master.create(function (agentList) {
	return {
		browser1: agentList[0].id,
		browser2: agentList[1].id
	};
});

describe('bop::', function () {
	it('hello', async function () {
		const native1 = new Native(master.agent('browser1'));
		const native2 = new Native(master.agent('browser2'));

		console.log(native1.title, native1.href, native1.ua);
		await native1.refresh();
		await utils.wait(1000);
		// const keywordInput = await native1.selectOne(['#kw']);
		// await keywordInput.setValue('1111');
		await native1.goto('/?aaaa=1');

		await native2.refresh();
		await utils.wait(3000);
		await native2.goto('/s?wd=2');
	});
});

// describe('destory::', function () {
// 	it('', async function () {

// 	})
// })