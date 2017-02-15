## p2p-todo

This is a simple todo list, but it is made for offline-first use as a single html file, but syncronized to multiple devices (or multiple people) via p2p (webRTC).

Built on top of [webrtc-swarm](http://npmjs.org/package/webrtc-swarm), and [hyperlog](https://www.npmjs.com/package/hyperlog), an append-only Merkle DAG that replicates based on scuttlebutt logs and causal linking.

### Installation

You can download `p2ptodo.html`, which includes everything, and you can place it on your hardrive (or in your filesystem on your mobile device), point your browser at the file, and you're ready to go.

Or you can serve the files locally or on a server with any web server (though if you are off-line, it would be difficult to reach your todo list!)

### Usage

Upon each use, `p2p-todo` will ask you for 3 things:

1) The url of a signalling server ([signalhub](http://npmjs.org/package/signalhub))

* Hitting 'Cancel' will select a default signalling server (https://signalhub.mafintosh.com)

2) The "app key" for finding peers when you want to sync across multiple devices or share your todo list with others.

* Hitting 'Cancel' will generate a random number as a key (it is displayed in the lower right corner if you need it later)

3) The database id. You can create and use multiple databases (stored via [level-browserify](https://www.npmjs.com/package/level-browserify)), or optionally enter 'memdb' to use a non-persistent in-memory database ([memdb](https://www.npmjs.com/package/memdb)).

* Hitting 'Cancel' will create/use a level database with id 'default'

### TODO philosophy

Aside from the standard 'done' and 'delete', I have added a 'priority' option. By default, a todo has priority and is featured in the center of the page. If you click the down-arrow, it will become 'de-prioritized'. The idea being that I tend to have too many todo items, and I just want to focus on the top 5 or so. So I would keep all of my todos de-prioritized, and every day just pick the ones I think I can get done by clicking the up-arrow to prioritize them.