import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: 'http://localhost:9200',
  auth: { username: 'elastic', password: 'password' },
});

async function run() {
  try {
    const response = await client.index({
      index: 'emails',
      document: {
        from: 'alice@example.com',
        subject: 'Elasticsearch test',
        body: 'This is a test email indexed successfully!',
      },
    });
    console.log('✅ Document indexed:', response);
  } catch (error) {
    console.error('❌ Error indexing document:', error);
  }
}

run();
