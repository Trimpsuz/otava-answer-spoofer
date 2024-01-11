const mockttp = require('mockttp');
const fs = require('fs');
const axios = require('axios');

(async () => {
  if (!fs.existsSync('./ssl/key.pem') || !fs.existsSync('./ssl/cert.pem')) {
    const { key, cert } = await mockttp.generateCACertificate();
    if (!fs.existsSync('./ssl')) await fs.promises.mkdir('./ssl');

    await fs.promises.writeFile('./ssl/key.pem', key);
    await fs.promises.writeFile('./ssl/cert.pem', cert);

    console.log('PLEASE INSTALL ./ssl/cert.pem INTO YOUR BROWSER! If asked, select "Trust this CA to identify webistes" or similar.');
  }

  const server = mockttp.getLocal({
    https: {
      keyPath: './ssl/key.pem',
      certPath: './ssl/cert.pem',
    },
  });

  server
    .forPost(/\/o\/task-container\/a\/[a-zA-Z0-9]+\/-\/answer/)
    .forHostname('materiaalit.otava.fi')
    .thenPassThrough({
      beforeRequest: async (request) => {
        let json = await request.body.getJson();

        json.learnerResponse = json.correctResponses[0];
        json.result = 'correct';

        console.log('Spoofed answer stored');

        return {
          body: JSON.stringify(json),
        };
      },
    });

  server
    .forPost(/\/o\/task-container\/a\/[a-zA-Z0-9]+\/-\/score/)
    .forHostname('materiaalit.otava.fi')
    .thenPassThrough({
      beforeRequest: async (request) => {
        let json = await request.body.getJson();

        json.score = json.scoreMax;

        console.log('Spoofed score stored');

        return {
          body: JSON.stringify(json),
        };
      },
    });

  server
    .forPost(/\/o\/task-container\/a\/[a-zA-Z0-9]+\/-\/suspend-data/)
    .forHostname('materiaalit.otava.fi')
    .thenPassThrough({
      beforeRequest: async (request) => {
        let json = await request.body.getJson();

        let suspendData = JSON.parse(json.suspendData);
        const qobj = Object.values(suspendData['Questions']);

        for (const section of qobj) {
          const sections = Object.values(section['Sections']);
          section.answersCheckCount = sections.length;
          section.wrongAnswersCount = 0;
          section.answerHasChanged = true;

          for (const section2 of sections) {
            delete section2['answer'];
            section2.wrongAnswersCount = 0;
            section2.locked = true;
            section2.answerHasChanged = true;
          }
        }

        json.suspendData = JSON.stringify(suspendData);

        console.log('Spoofed suspend data stored');

        return {
          body: JSON.stringify(json),
        };
      },
    });

  server.forUnmatchedRequest().thenPassThrough();

  await server.start(8080);

  const caFingerprint = mockttp.generateSPKIFingerprint(fs.readFileSync('./ssl/cert.pem'));
  console.log(`Server running on port ${server.port}`);
  console.log(`CA cert fingerprint ${caFingerprint}`);
})();
