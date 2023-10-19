// TODO : randomly drop a blop and/or create a new one

import { Bundle, Client, Server } from "node-osc";
import { createNoise2D } from "simplex-noise";

const PORT = 10000;

const FLOOR_WALL_TX_MAXIMUM = 5.863999843597412;
const FLOOR_WALL_TY_MAXIMUM = 6.25;
const FLOOR_TX_MAXIMUM = 5.863999843597412;
const FLOOR_TY_MAXIMUM = 3.125;
const WALL_TX_MAXIMUM = 5.863999843597412;
const WALL_TY_MAXIMUM = 3.125;

function* idGenerator(id) {
  while (true) {
    id += 1;
    yield id;
  }
}

const idIterator = idGenerator(Math.floor(Math.random() * 10000) + 1);

let wall = getBlobArray(10);
let floor = getBlobArray(20);
const noise2D = createNoise2D();
const NOISE_WALKING_SPEED = 0.1;

// // lOOPBACK LISTENER FOR TESTING
// let log = "";

// const oscServer = new Server(PORT, "0.0.0.0", () => {
//   console.log("Server started");
// });

// oscServer.on("message", function (msg) {
//   console.log(`Message: ${msg}`);
//   log += "\n" + msg;
// });

// oscServer.on("bundle", function (bundle) {
//   bundle.elements.forEach((element, i) => {
//     if (bundle.timetag[i]) {
//       console.log(`Timestamp: ${bundle.timetag[i]}`);
//     }

//     console.log("" + element);
//   });
// });

const client = new Client("127.0.0.1", PORT);

function getBlobArray(size) {
  let blobs = new Array(size);

  for (let i = 0; i < size; i++) {
    if (Math.random() < 0.7) {
      blobs[i] = {
        id: 0,
        // tx: 0, // redundant, will be derived from u
        // ty: 0, // redundant, will be derived from v
        u: 0,
        v: 0,
      };
    } else {
      blobs[i] = {
        id: idIterator.next().value,
        // tx: 0, // redundant, will be derived from u
        // ty: 0, // redundant, will be derived from v
        u: 0,
        v: 0,
      };
    }
  }

  return blobs;
}

function updateBlobArray(blobs) {
  for (let i = 0; i < blobs.length; i++) {
    if (blobs[i].id == 0) {
      continue;
    }

    blobs[i].u =
      noise2D(Date.now() * NOISE_WALKING_SPEED + blobs[i].id, 0) * 0.5;
    blobs[i].v =
      noise2D(0, Date.now() * NOISE_WALKING_SPEED + blobs[i].id) * 0.5;
  }
}

setInterval(() => {
  updateBlobArray(floor);
  updateBlobArray(wall);

  let bundleContent = [["/_samplerate", 60]];

  const floor_wallPart = wall
    .concat(floor)
    .map((blob, i) => {
      const prefix = `/SOL_MUR/blobs/blob${i}/`;

      return [
        [prefix + "id", blob.id],
        [prefix + "tx", blob.u * FLOOR_WALL_TX_MAXIMUM],
        [prefix + "ty", blob.v * FLOOR_WALL_TY_MAXIMUM],
        [prefix + "u", blob.u],
        [prefix + "v", blob.v],
      ];
    })
    .flat(1);

  const floor_wallSpecs = [
    ["/SOL_MUR/specs/Scalex", FLOOR_WALL_TX_MAXIMUM],
    ["/SOL_MUR/specs/Scaley", FLOOR_WALL_TY_MAXIMUM],
  ];

  const wallPart = wall.map((blob, i) => {
    const prefix = `/MUR/blobs/blob${i}/`;

    return [
      [prefix + "id", blob.id],
      [prefix + "tx", blob.u * WALL_TX_MAXIMUM],
      [prefix + "ty", blob.v * WALL_TY_MAXIMUM],
      [prefix + "u", blob.u],
      [prefix + "v", blob.v],
    ];
  });

  const wallSpecs = [
    ["/MUR/specs/Scalex", WALL_TX_MAXIMUM],
    ["/MUR/specs/Scaley", WALL_TY_MAXIMUM],
  ];

  const floorPart = floor.map((blob, i) => {
    const prefix = `/SOL/blobs/blob${i}/`;

    return [
      [prefix + "id", blob.id],
      [prefix + "tx", blob.u * FLOOR_TX_MAXIMUM],
      [prefix + "ty", blob.v * FLOOR_TY_MAXIMUM],
      [prefix + "u", blob.u],
      [prefix + "v", blob.v],
    ];
  });

  const floorSpecs = [
    ["/SOL/specs/Scalex", FLOOR_TX_MAXIMUM],
    ["/SOL/specs/Scaley", FLOOR_TY_MAXIMUM],
  ];

  const finalBundle = bundleContent
    .concat(floor_wallPart)
    .concat(floor_wallSpecs)
    .concat(wallPart)
    .concat(wallSpecs)
    .concat(floorPart)
    .concat(floorSpecs);

  client.send(new Bundle(...finalBundle));
}, 0);
