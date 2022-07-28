const cheerio = require('cheerio');
const axios = require('axios');
const aws = require('aws-sdk');

const ses = new aws.SES({ region: 'eu-central-1' });

exports.handler = (event, context, callback) => {
  let mittagskarte = '';

  axios.get('https://idueamici.de/mittagskarte/').then((res) => {
    const $ = cheerio.load(res.data);
    let elements = $('span.jet-listing-dynamic-field__content').html();

    elements.split('<p>***<br>').forEach((tagesgericht) => {
      if (tagesgericht.includes('strong&gt;')) {
        tagesgericht = tagesgericht.replace(
          'strong&gt;Donnerstag',
          '<strong>Donnerstag<strong>'
        );
      }
      mittagskarte += tagesgericht;
    });

    const params = {
      Destination: {
        ToAddresses: ['s.laukhardt@gmail.com']
      },
      Message: {
        Body: {
          Html: {
            Data: `<html><head></head><body><h2>Mittagstisch Wochenkarte</h2>
          <p>${restDerWocheString}</p>
          <br>
          <a href="https://idueamici.de/mittagskarte/">Due Amici Mittagstisch Karte</a>
        </body>
        </html>`
          }
        },
        Subject: { Data: 'Reminder: Due Amici Mittagstisch' },
        Source: 'sebastian.laukhardt@gmail.com'
      }
    };

    ses.sendEmail(params, function (err, data) {
      callback(null, { err: err, data: data });
      if (err) {
        console.log(err);
        context.fail(err);
      } else {
        console.log(data);
        context.succeed(event);
      }
    });
  });
};
