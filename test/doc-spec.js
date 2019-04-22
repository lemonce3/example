const assert = require('assert');
const Sequelize = require('sequelize');
const { Master, utils } = require('@lemonce3/interface');
const Native = require('@lemonce3/interface/interface/native');
const Player = require('@lemonce3/interface/interface/player');

const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'mysql',
  host: "my.server.tld",
  port: 9821,
})

const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING
  }
});

const Task = sequelize.define('task', {
  id: {
    type: Sequelize.NUMBER,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING
  },
  detail: {
		type: Sequelize.STRING
  }
});

describe('处理待办任务', async function () {
	let native1 = null;
	
	const userList = [  //准备用户数据
		{
			username: 'test1',
			password: 'testpw'
		},
		{
			username: 'test2',
			password: 'testpw'
		}
	];

	const taskList = [  //准备任务数据
		{
			id: 1,
			title: 'testTask1',
			detail: 'procedure=1'
		},
		{
			id: 2,
			title: 'testTask2',
			detail: 'procedure=2'
		},
		{
			id: 3,
			title: 'testTask3',
			detail: 'procedure=3'
		},
	];

	before(async function() {  //在套件所有操作前执行，准备数据
		await User.truncate();
		await User.bulkCreate(userList);

		Master.create(function (agentList) {  //创建Master
			return {
				browser1: agentList[0].id
			};
		});
		
		native1 = new Native(master.agent('browser1')); //缓存agent的native接口
		await native1.goto('/todo.html');  //进入待办任务页面
	});
	
	after(async function() {  //在套件所有操作后执行，清理数据
		await User.truncate();
		
		Master.destory();  //销毁Master
	});
	
	beforeEach(async function() {  //在每个用例前执行
		await Task.truncate();  //确保清空数据表

		await Task.bulkCreate(taskList);  //插入数据

		const userInfo = await native1.seleteOne(['#userInfo']);

		if (userInfo) {
			await native1.seleteOne(['#logoutButton']).click();  //确保为登出状态
		}
	});
	
	afterEach(async function() {  //在每个用例后执行
		await Task.truncate();  //清空数据表
	});

	it('业务员未登录', async function() {
		const taskMenu = await native1.seleteOne(['#taskMenu']).click();  //进入任务大厅

		const taskList = await native1.seleteOne(['#taskList']).click();  //进入任务列表

		const task = await native1.seleteOne(['.task-todo']).click();  //选择一个待办任务进行处理

		const unauthModal = await native1.seleteOne(['#unauthModal']);  //寻找未登录提醒
		if (!unauthModal) {  //用js做简单断言
			throw new Error('没有找到登录提醒');
		}

		const okButton = await native1.seleteOne(['#okButton']).click();  //点击未登录提醒的确定按钮
	});

	it('业务员已登录', async function() {
		const user = await User.findAll({  //从数据库中随机抽取真实用户
			order: sequelize.random(),
			limit: 1
		});

		await Player.play(master.agent('main'))  //使用高级API高效描述动作
			.input(['#usernameInput'], user.username)  //输入用户名密码进行登录
			.input(['#passwordInput'], user.password)
			.click(['#loginButton'])
			.click(['#taskMenu'])  //进入任务大厅
			.click(['#taskList']);  //进入任务列表

		const task = await native1.seleteOne(['.task-todo']).click();  //选择一个待办任务进行处理

		assert.equal(await task.getAttributes('complete'), true); //确认任务状态为已完成
	});
});


describe('任务', async function () {
	const username = 'test1';  //准备登录用户
	const password = 'testpw';

	const taskList = [  //准备任务数据
		{
			id: 1,
			title: 'testTask1',
			detail: 'procedure=1'
		},
		{
			id: 2,
			title: 'testTask2',
			detail: 'procedure=2'
		},
		{
			id: 3,
			title: 'testTask3',
			detail: 'procedure=3'
		},
	];

	before(async function() {  //在套件所有操作前执行
		await User.create({  //创建测试用户
			username,
			password
		});
	});

	after(async function() {  //在套件所有操作后执行
		await User.truncate();
	});

	beforeEach(async function() {  //在每个用例前执行
		await Task.truncate();  //确保清空数据表

		await Task.bulkCreate(taskList);  //插入数据

		let userInfo = await native1.seleteOne(['#userInfo']);

		if (!userInfo) {
			await native1.seleteOne(['#loginButton']).click();  //确保为登录状态

		await Player.play(master.agent('main'))  //使用高级API高效描述动作
		.input(['#usernameInput'], username)
		.input(['#passwordInput'], password)
		.click(['#loginButton']);

		userInfo = await native1.seleteOne(['#userInfo']);

		if (!userInfo) {
			throw new Error('未找到用户信息');
		}

		await native1.seleteOne(['#taskMenu']).click();  //跳转到待办任务界面
	});

	afterEach(async function() {  //在每个用例后执行
		await Task.truncate();  //清空数据表

		const userInfo = await native1.seleteOne(['#userInfo']);

		if (userInfo) {
			await native1.seleteOne(['#logoutButton']).click();  //执行后需要登出
		}
	});

	it('查询任务', async function() {		
		const todoTaskList = await native1.seleteAll(['.task-todo']);  //确认待办任务数量
		assert.equal(todoTaskList.length, await Task.count());  //使用断言库和数据库查询断言
	});

	it('新增任务', async function() {
		const task = {  //准备任务数据
			title: 'testTask1',
			detail: 'procedure=1'
		};

		const taskList = await native1.seleteAll(['.task-todo']);  //确认待办任务数量

		await Player.play(master.agent('main'))  //使用高级API高效描述动作
		.click(['#createTaskButton'])  //新增任务，输入数据
		.input(['#titleInput'], task.title)
		.input(['#detailInput'], task.detail)
		.click(['#okButton']);

		const newList = await native1.seleteAll(['.task-todo']);  //确认待办任务数量

		assert.equal(todoTaskList.length + 1, newList.length);
		assert.equal(todoTaskList.length + 1, await Task.count());  //使用断言库和数据库查询断言

		const newTask = Task.findOne({
			where: {
				title,
				detail
			}
		});

		assert.equal(task, newTask);
	});

	it('修改任务', async function() {
		const todoTaskList = await native1.seleteAll(['.task-todo']);  //选择待办任务
		const task = todoTaskList[0];
		const newTitle = 'procedure=4';  //准备修改数据

		native1.seleteOne([`.task-todo[title=${task.title}] > .updateButton`]).click(); //点击修改按钮
		native1.seleteOne(['#titleInput']).setValue(newTitle);

		const newList = await native1.seleteAll(['.task-todo']);  //确认待办任务数量

		assert.equal(todoTaskList.length, newList.length);  //使用断言库和数据库查询断言

		const newTask = await Task.findOne({
			where: {
				id: await task.getAttributes('taskId')
			}
		})

		assert.equal(await task.getAttributes(title), newTitle);
		assert.equal(newTask.title, newTitle);
	});

	it('删除任务', async function() {
		const todoTaskList = await native1.seleteAll(['.task-todo']);  //确认待办任务数量
		const task = todoTaskList[0];

		native1.seleteOne([`.task-todo[title=${task.title}] > .deleteButton`]).click();  //点击删除按钮

		const newList = await native1.seleteAll(['.task-todo']);  //确认待办任务数量

		assert.equal(todoTaskList.length - 1, newList.length);
		assert.equal(todoTaskList.length - 1, await Task.count());  //使用断言库和数据库查询断言
	});

});

describe('业务员注册与登录', async function () {
	let native1 = null;  //准备数据

	const username = 'test1';
	const password = 'testpw';

	before(async function() {  //在套件所有操作前执行
		Master.create(function (agentList) {  //创建Master
			return {
				browser1: agentList[0].id
			};
		});
		
		native1 = new Native(master.agent('browser1'));  //缓存agent的native接口
		await native1.goto('/user.html');
	});

	after(async function() {  //在套件所有操作后执行
		Master.destory();  //销毁Master
	});

	beforeEach(async function() {  //在每个用例前执行
		await User.truncate();  //确保清空数据表

		const userInfo = await native1.seleteOne(['#userInfo']);

		if (userInfo) {
			await native1.seleteOne(['#logoutButton']).click();  //确保为登出状态
		}
	});

	afterEach(async function() {  //在每个用例后执行
		await User.truncate();  //清空数据表
	});

	it('注册', async function() {
		await Player.play(master.agent('main'))  //使用高级API高效描述动作
		.click(['#registerButton'])
		.input(['#usernameInput'], username)  //输入新用户数据和验证码
		.input(['#passwordInput'], password)
		.input(['#comfirmPassword'], password)
		.input(['#captcha'], 'ou2c')
		.click(['#okButton']);

		const user = await User.findOne({
			where: {
				username
			}
		});

		if (!user) {
			throw new Error('数据库中没有用户信息');
		}
	});

	it('登录', async function() {
		await User.create({  //插入测试数据
			username,
			password
		});

		await Player.play(master.agent('main'))  //使用高级API高效描述动作
		.input(['#usernameInput'], username)
		.input(['#passwordInput'], password)
		.click(['#loginButton']);

		const userInfo = await native1.seleteOne(['#userInfo']);

		if (!userInfo) {
			throw new Error('未找到用户信息');
		}
	});
});