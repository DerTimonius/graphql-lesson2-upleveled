import { ApolloServer, gql, makeExecutableSchema } from 'apollo-server-micro';

require('dotenv').config();
const postgres = require('postgres');
const sql = postgres();

const typeDefs = gql`
  type Query {
    users: [User!]!
    user(username: String): User
    todos(checked: Boolean): [Todo]
    todo(id: ID!): Todo
  }
  type User {
    name: String
    username: String
  }
  type Todo {
    id: ID!
    title: String
    checked: Boolean
  }
  type Mutation {
    createTodo(title: String!): Todo
  }
`;
const users = [
  { name: 'Leeroy Jenkins', username: 'leeroy' },
  { name: 'Foo Bar', username: 'foobar' },
];

async function getTodos() {
  return await sql`select * from todos`;
}

async function getFilteredTodos(checked) {
  return await sql`select * from todos WHERE checked = ${checked}`;
}

async function getTodo(id) {
  const result = await sql`select * from todos WHERE id = ${id}`;
  return result[0];
}

async function createTodo(title) {
  const result = await sql`INSERT INTO todos (title, checked)
  VALUES (${title}, ${false}) RETURNING id, title, checked`;
  return result[0];
}

const resolvers = {
  Query: {
    users() {
      return users;
    },
    user(parent, { username }) {
      return users.find((user) => user.username === username);
    },
    todos(parent, { checked }) {
      if (checked === undefined) {
        return getTodos();
      }
      return getFilteredTodos(checked);
    },
    todo(parent, { id }) {
      return getTodo(id);
    },
  },

  Mutation: {
    createTodo: (parent, { title }) => {
      return createTodo(title);
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default new ApolloServer({ schema }).createHandler({
  path: '/api/graphql',
});
