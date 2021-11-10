const https = require('https');
const HTMLParser = require('node-html-parser');
const prompts = require('prompts');
const fs = require('fs').promises;
const execShPromise = require("exec-sh").promise;

exports.tubeViewer = function() {
  let host = 'https://vid.puffyan.us';
  let filePath;
  let p;
  let interval
  
  let myArgs = process.argv.slice(2);

  if(myArgs[0] !== undefined) {
    filePath = myArgs[0];
    let fileData = filepath => {
      return fs.readFile(filepath).then(data => { return data = data.toString().split("\n")});
    }
    p = fileData(filePath);
  } else {
    console.log('You link is empty');
  }

  p.then((results) => {
    return new Promise((res, rej) => {
      console.log('Put channel names...');
      setTimeout(() => {
        urlsChannel = results;
        let channels = []; 
        for(link of results) {
          let objLink = link; 
          https.get(link, (response) => {
            let htmlChannel;
            response.on('data', (chunk) => {
              htmlChannel += chunk;
            });
            response.on('end', () => {
              htmlChannel = HTMLParser.parse(htmlChannel).querySelector('.channel-profile > span:nth-child(2)');
              htmlChannel = htmlChannel.text;
              let ob = Object.create({});
              ob.title = htmlChannel;
              ob.value = objLink;
              channels.push(ob);
            });
          });
        }
        res(channels);
      }, 5000);   
    });
  }).then(data => {
    const p2 = new Promise((res, rej) => {
      setTimeout(() => {
        let channelsList = [
          {
            type: 'select',
            name: 'value',
            message: 'Pick a channel',
            choices: data
          }
        ]
        res(channelsList);
      }, 2000)
    });
    p2.then((channelsList) => {
      (async() => {
        let response = await prompts(channelsList);
        p3(response.value)
      })();
    });
  });

  let p3 = link => {
    return new Promise((res, rej) => {
        let videos = [];
        https.get(link, (response) => {
          let linksList = [];
          let titlesList = [];
          let htmlVideo;
          response.on('data', (chunk) => {
            htmlVideo += chunk;
          });
          response.on('end', () => {
            console.log('Get video list...');
            let regex = new RegExp('=1\$');
            let links = HTMLParser.parse(htmlVideo).querySelectorAll('a');
            let titles = HTMLParser.parse(htmlVideo).querySelectorAll('div:nth-child(1) > a:nth-child(1) > p:nth-child(2)');
            
            for (let link of links) {
              link = link.getAttribute('href');
              linksList.push(link);
              linksList = linksList.filter(l => l.match(regex));
              for (let title of titles) {
                title = title.text;
                titlesList.push(title);     
              }
            }
            for ( let i = 0; i < linksList.length; i++) {
              let ob = Object.create({});
              ob.title = titlesList[i];
              ob.value = linksList[i];
              videos.push(ob);
            }
            res(videos);
          })       
        })
    }).then((data) => {
      const p4 = new Promise((res, rej) => {
        let quest = [
          {
            type: 'select',
            name: 'value',
            message: 'Pick a video',
            choices: data
          }
        ];
        res(quest);
      })
      p4.then((quest) => {
      (async function viewList() {
          let response = await prompts(quest, {onCancel:cleanup, onSubmit:cleanup});
          const run = async () => {
            let out;
            try {
              out = await execShPromise(`mpv ${host + response.value}` , true);
            } catch (e) {
              console.log('Error: ', e);
              console.log('Stderr: ', e.stderr);
              console.log('Stdout: ', e.stdout);  
              return e;
            }
            console.log(out.stdout, out.stderr);
          }
          run();
          viewList();
        })();
      });
      function cleanup() {
        clearInterval(interval);
      }
    });
  };
}