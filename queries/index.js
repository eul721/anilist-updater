import findAnimeByID from './findAnimeByID.gql'

const ops = {
    findAnimeByID
}

Object.keys(ops).forEach(key => {
    const query = ops[key];
    ops[key] = (client, variables) => client.request(query, variables);
});

export default ops;