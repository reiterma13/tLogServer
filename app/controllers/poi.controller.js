/**
 * Created by salho on 13.10.16.
 */
import POI from '../models/poi.model';
import mongoose from "mongoose";
import grid from "gridfs-stream";
import gm from "gm";
import fs from "fs";
grid.mongo = mongoose.mongo;

export const addLikedandRating = (pois,req) => {
  let modpois = [];
  pois.forEach(poi => {
    if (poi.likes.map(e => String(e.userid)).indexOf(req.user.id) != -1) {
      poi.liked = true;
    } else {
      poi.liked = false;
    }
    if (poi.ratings != undefined) {
      const index = poi.ratings.map(e => String(e.userid)).indexOf(req.user.id);
      if (index != -1) {
        poi.rating = poi.ratings[index].rating;
      }
      let totalrating = 0;
      poi.ratings.forEach(e => totalrating += e.rating);
      poi.totalrating = totalrating / poi.ratings.length;
    }
    modpois.push(poi);
  })
  return modpois;
}

export const create = (req, res, next) => {
  const poi = new POI(req.body);
  poi.creator = req.user.id;
  poi.save()
    .then(poi => POI.load(poi._id))
    .then(poi => {
      req.poi = poi;
      next()
    })
    .catch(err => res.status(400).json({message: err.message}));
};

export const all = (req, res, next) => {
  try {
    let page = parseInt(req.query.page || '0');
    let size = parseInt(req.query.size || '10');
    POI.find()
      .sort('-createdAt')
      .skip(page * size)
      .limit(size)
      .populate('creator', 'local.username')
      .then(data => res.json(addLikedandRating(data,req)))
      .catch(err => res.status(500).json({message: err.message}))
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const load = (req, res, next, id) => {
  try {
    POI.load(id)
      .then(poi => {
        req.poi = poi;
        next()
      })
      .catch(err => res.status(400).json({message: "This POI could not be found"}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const show = (req, res) => {
  if (req.poi.likes.map(e => String(e.userid)).indexOf(req.user.id) != -1) {
    req.poi.liked = true;
  } else {
    req.poi.liked = false;
  }
  if (req.poi.ratings != undefined) {
    const index = req.poi.ratings.map(e => String(e.userid)).indexOf(req.user.id);
    if (index != -1) {
      req.poi.rating = req.poi.ratings[index].rating;
    }
    let totalrating = 0;
    req.poi.ratings.forEach(e => totalrating += e.rating);
    req.poi.totalrating = totalrating / req.poi.ratings.length;
  }
  res.json(req.poi);
};

export const update = (req, res, next) => {
  try {
    const poi = Object.assign(req.poi, req.body);
    poi.save()
      .then(poi => POI.load(poi._id))
      .then(poi => {
        req.poi = poi;
        next()
      })
      .catch(err => res.status(400).json({message: "This POI could not be updated: "+ err.message}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const destroy = (req, res, next) => {
  try {
    req.poi.remove()
      .then(()=>next())
      .catch(err => res.status(500).json({message: "Could not delete this POI"}))
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const image = (req, res) => {
  try {
    const gfs = grid(mongoose.connection.db);
    console.log("id="+req.params.imageId);
    let ObjectID = mongoose.mongo.ObjectID;
    gfs.createReadStream({_id: new ObjectID(req.params.imageId)}).pipe(res);
  } catch(err) {
    res.status(500).json({message: err.message})
  }
};


export const mine = (req,res,next) =>{
  try {
    POI.find({creator: req.user.id}).sort("-createdAt").populate('creator', 'local.username')
      .then(pois => res.json(addLikedandRating(pois,req)))
  .catch(err => res.status(400).json({message: err.message}))
  } catch(err) {res.status(500).json({message: err.message})}
};


export const addImage = function (req, res) {
  try {
    const gfs = grid(mongoose.connection.db);
    const maxDimension = process.env.MAX_IMAGE_DIMENSION || 500;
    if (req.files.file == null) {
      res.status(400).json({
        message: "There needs to be an element called 'file' that contains the image"
      });
      return;
    }
    const file = req.files.file;
    const wStream = gfs.createWriteStream({
      mode: 'w',
      filename: file.name,
      content_type: file.type,
      metadata: {
        poi: req.poi._id,
        creator: req.user.id
      }
    });
    const s = gm(file.path).resize(maxDimension).stream().pipe(wStream);
    s.on('close', file => {
      const poi = req.poi;
      poi.images.push({
        description: req.body.description,
        id: file._id,
        uploaded: Date.now(),
        user: req.user.username
      });
      poi.save()
        .then(poi => res.json(file))
        .catch(err => res.status(500).send({
          message: "Could not add image to POI " + err.message
        }));
    });
    s.on('error',  error => {
      res.status(500).send({
        message: "Could not save image"
      });
    });
  } catch (error) {
    console.log(error.stack);
    res.status(500).send({
      message: "Could not save image " + error.message
    });
  }
};

export const like = (req, res, next) => {
  try {
    const poi = req.poi;
    const index = poi.likes.map(e => String(e.userid)).indexOf(req.user.id);
    //console.log(index);
    if (index != -1) {
      poi.likes.splice(index, 1);
    } else {
      poi.likes.push({
        userid: req.user.id,
        username: req.user.username
      });
    }
    poi.save()
      .then(poi => POI.load(poi._id))
      .then(poi => {
        req.poi = poi;
        next();
      })
      .catch(err => res.status(400).json({message: "The POI could not be liked: "+ err.message}));
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};

export const rate = (req, res, next) => {
  try {
    const poi = req.poi;
    let rating = req.body.number;
    if (rating < 1) {
      rating = 1;
    } else if (rating > 5) {
      rating = 5;
    }
    if (rating != undefined) {
      console.log(req.body);
      const index = poi.ratings.map(e => String(e.userid)).indexOf(req.user.id);
      if (index != -1) {
        poi.ratings.splice(index, 1);
        poi.ratings.push({
          userid: req.user.id,
          username: req.user.username,
          rating: rating
        });
      } else {
        poi.ratings.push({
          userid: req.user.id,
          username: req.user.username,
          rating: rating
        });
      }
      poi.save()
        .then(poi => POI.load(poi._id))
        .then(poi => {
          req.poi = poi;
          next();
        })
        .catch(err => res.status(400).json({message: "The POI could not be rated: " + err.message}));
    } else {
      res.status(500).json({message: "Could not rate!"});
    }
  } catch (err) {
    res.status(500).json({message: err.message})
  }
};
