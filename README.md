## p2p-todo

This is a simple todo list, but it is made for offline-first use as a single html file, but syncronized to multiple devices (or multiple people) via p2p (webRTC).

Built on top of [webrtc-swarm](http://npmjs.org/package/webrtc-swarm), and [hyperlog](https://www.npmjs.com/package/hyperlog), an append-only Merkle DAG that replicates based on scuttlebutt logs and causal linking.

### Installation

You can download `p2ptodo.html` [here](https://github.com/brodavi/p2p-todo/raw/master/p2ptodo.html), which includes everything, and you can place it on your hardrive (or in your filesystem on your mobile device), point your browser at the file, and you're ready to go.

Or you can clone this repo and serve the files locally or on a server with any web server (though if you are off-line, it would be difficult to reach your todo list!)

If anyone is interested, I use [inliner](https://www.npmjs.com/package/inliner) to build `p2ptodo.html`.

### Usage

Options: along with pointing your browser to `p2p-todo`, whether served somewhere or from your local file system, it is convenient to add additional options to the url. For instance, if you are pointing to a downloaded single file version, an example url would be:

`file:///home/brodavi/downloads/p2ptodo.html?signalhub=https://signalhub.mafintosh.com&key=test&db=shopping`

Here you can see I have specified the signalling server `https://signalhub.mafintosh.com`, the app key `test`, and the db id `shopping`

If you don't specify the options in the url, then `p2p-todo` will ask you for those 3 things:

1) The url of a signalling / [signalhub](http://npmjs.org/package/signalhub) server

* Hitting 'Cancel' will select a default signalling server (https://signalhub.mafintosh.com)

2) The "app key" for finding peers when you want to sync across multiple devices or share your todo list with others.

* Hitting 'Cancel' will generate a random number as a key (it is displayed in the lower right corner if you need it later)

3) The database id. You can create and use multiple databases (stored via [level-browserify](https://www.npmjs.com/package/level-browserify)), or optionally enter 'memdb' to use a non-persistent in-memory database ([memdb](https://www.npmjs.com/package/memdb)). This is also displayed in the lower right corner if you need it later.

* Hitting 'Cancel' will create/use a level database with id 'default'

Once the app is running, there is a link in the lower right hand corner. You can use this link to create another instance of the app or use it as a bookmark.

### Import / Export

If you ever get tired of the entire history of your todo list being re-played every time you open the app, you can use the "export" and "import" buttons. "export" will open a textare with a JSON representation of your todos. You can copy this text, and in a new app id, use the "import" button to paste the text, importing the current todo list. This effectively "forgets" everything before this version of reality.

### TODO philosophy

Aside from the standard 'done' and 'delete', I have added a 'priority' option. By default, a todo has priority and is featured in the center of the page. If you click the down-arrow, it will become 'de-prioritized'. The idea being that I tend to have too many todo items, and I just want to focus on the top 5 or so. So I would keep all of my todos de-prioritized, and every day just pick the ones I think I can get done by clicking the up-arrow to prioritize them.

### Note on mobile devices

If your mobile device goes to sleep, and the syncing doesn't appear to be working, just reload the browser and you should be up and running again (assuming you chose a persistent database).