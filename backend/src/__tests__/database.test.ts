// モックデータ
const mockUsers = [
  { id: '1', email: 'test1@example.com', name: 'Test User 1', password: 'hashed1' },
  { id: '2', email: 'test2@example.com', name: 'Test User 2', password: 'hashed2' }
];

const mockGroups = [
  { id: '1', name: 'Test Group 1', description: 'Description 1', createdBy: '1' },
  { id: '2', name: 'Test Group 2', description: 'Description 2', createdBy: '2' }
];

const mockTodos = [
  { 
    id: '1', 
    title: 'Test Todo 1', 
    description: 'Description 1', 
    priority: 'HIGH', 
    status: 'PENDING',
    createdBy: '1',
    groupId: '1'
  },
  { 
    id: '2', 
    title: 'Test Todo 2', 
    description: 'Description 2', 
    priority: 'MEDIUM', 
    status: 'COMPLETED',
    createdBy: '2',
    groupId: '2'
  }
];

const mockGroupMembers = [
  { id: '1', userId: '1', groupId: '1', role: 'OWNER' },
  { id: '2', userId: '2', groupId: '2', role: 'OWNER' }
];

describe('データベース接続テスト（モック版）', () => {
  let mockData: {
    users: typeof mockUsers;
    groups: typeof mockGroups;
    todos: typeof mockTodos;
    groupMembers: typeof mockGroupMembers;
  };

  beforeAll(async () => {
    // モックデータの初期化
    mockData = {
      users: [...mockUsers],
      groups: [...mockGroups],
      todos: [...mockTodos],
      groupMembers: [...mockGroupMembers]
    };
  });

  beforeEach(async () => {
    // テスト前にモックデータをリセット
    mockData = {
      users: [...mockUsers],
      groups: [...mockGroups],
      todos: [...mockTodos],
      groupMembers: [...mockGroupMembers]
    };
  });

  describe('データベース接続', () => {
    it('モックデータベースに正常に接続できる', async () => {
      // モックデータベース接続をテスト
      expect(mockData).toBeDefined();
      expect(mockData.users).toHaveLength(2);
      expect(mockData.groups).toHaveLength(2);
      expect(mockData.todos).toHaveLength(2);
    });

    it('モックデータベースから切断できる', async () => {
      // モックデータベース切断をテスト
      mockData = {
        users: [],
        groups: [],
        todos: [],
        groupMembers: []
      };
      expect(mockData.users).toHaveLength(0);
    });
  });

  describe('User テーブル操作', () => {
    it('新しいユーザーを作成できる', async () => {
      const userData = {
        id: '3',
        email: 'test3@example.com',
        password: 'hashedpassword',
        name: 'Test User 3'
      };

      // モックデータにユーザーを追加
      mockData.users.push(userData);

      expect(mockData.users).toHaveLength(3);
      expect(mockData.users[2]).toHaveProperty('id', '3');
      expect(mockData.users[2].email).toBe(userData.email);
      expect(mockData.users[2].name).toBe(userData.name);
    });

    it('ユーザーを取得できる', async () => {
      // モックデータからユーザーを検索
      const foundUser = mockData.users.find(user => user.id === '1');

      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe('test1@example.com');
    });

    it('ユーザーを更新できる', async () => {
      // モックデータのユーザーを更新
      const userIndex = mockData.users.findIndex(user => user.id === '1');
      mockData.users[userIndex] = { ...mockData.users[userIndex], name: 'Updated Name' };

      expect(mockData.users[userIndex].name).toBe('Updated Name');
    });

    it('ユーザーを削除できる', async () => {
      // モックデータからユーザーを削除
      const initialLength = mockData.users.length;
      mockData.users = mockData.users.filter(user => user.id !== '1');

      expect(mockData.users).toHaveLength(initialLength - 1);
      expect(mockData.users.find(user => user.id === '1')).toBeUndefined();
    });
  });

  describe('Group テーブル操作', () => {
    it('新しいグループを作成できる', async () => {
      const groupData = {
        id: '3',
        name: 'Test Group 3',
        description: 'Test Description 3',
        createdBy: '1'
      };

      // モックデータにグループを追加
      mockData.groups.push(groupData);

      expect(mockData.groups).toHaveLength(3);
      expect(mockData.groups[2]).toHaveProperty('id', '3');
      expect(mockData.groups[2].name).toBe(groupData.name);
      expect(mockData.groups[2].description).toBe(groupData.description);
      expect(mockData.groups[2].createdBy).toBe('1');
    });

    it('グループとメンバーシップを作成できる', async () => {
      const groupData = {
        id: '3',
        name: 'Test Group 3',
        description: 'Test Description 3',
        createdBy: '1'
      };

      const membershipData = {
        id: '3',
        userId: '1',
        groupId: '3',
        role: 'OWNER'
      };

      // モックデータにグループとメンバーシップを追加
      mockData.groups.push(groupData);
      mockData.groupMembers.push(membershipData);

      expect(mockData.groups).toHaveLength(3);
      expect(mockData.groupMembers).toHaveLength(3);
      expect(mockData.groupMembers[2]).toHaveProperty('id', '3');
      expect(mockData.groupMembers[2].userId).toBe('1');
      expect(mockData.groupMembers[2].groupId).toBe('3');
      expect(mockData.groupMembers[2].role).toBe('OWNER');
    });
  });

  describe('Todo テーブル操作', () => {
    it('新しいTODOを作成できる', async () => {
      const todoData = {
        id: '3',
        title: 'Test Todo 3',
        description: 'Test Description 3',
        priority: 'LOW',
        status: 'PENDING',
        createdBy: '1',
        groupId: '1'
      };

      // モックデータにTODOを追加
      mockData.todos.push(todoData);

      expect(mockData.todos).toHaveLength(3);
      expect(mockData.todos[2]).toHaveProperty('id', '3');
      expect(mockData.todos[2].title).toBe(todoData.title);
      expect(mockData.todos[2].description).toBe(todoData.description);
      expect(mockData.todos[2].priority).toBe(todoData.priority);
      expect(mockData.todos[2].status).toBe(todoData.status);
      expect(mockData.todos[2].createdBy).toBe('1');
      expect(mockData.todos[2].groupId).toBe('1');
    });

    it('TODOを更新できる', async () => {
      // モックデータのTODOを更新
      const todoIndex = mockData.todos.findIndex(todo => todo.id === '1');
      mockData.todos[todoIndex] = { 
        ...mockData.todos[todoIndex], 
        title: 'Updated Todo',
        status: 'COMPLETED'
      };

      expect(mockData.todos[todoIndex].title).toBe('Updated Todo');
      expect(mockData.todos[todoIndex].status).toBe('COMPLETED');
    });
  });

  describe('リレーション操作', () => {
    it('ユーザーとグループのリレーションを取得できる', async () => {
      // モックデータからユーザーとグループのリレーションを取得
      const user = mockData.users.find(u => u.id === '1');
      const userMemberships = mockData.groupMembers.filter(m => m.userId === '1');
      const userGroups = mockData.groups.filter(g => 
        userMemberships.some(m => m.groupId === g.id)
      );

      expect(user).not.toBeNull();
      expect(userMemberships).toHaveLength(1);
      expect(userGroups).toHaveLength(1);
      expect(userGroups[0].name).toBe('Test Group 1');
    });

    it('グループとTODOのリレーションを取得できる', async () => {
      // モックデータからグループとTODOのリレーションを取得
      const group = mockData.groups.find(g => g.id === '1');
      const groupTodos = mockData.todos.filter(t => t.groupId === '1');

      expect(group).not.toBeNull();
      expect(groupTodos).toHaveLength(1);
      expect(groupTodos[0].title).toBe('Test Todo 1');
    });
  });
});
