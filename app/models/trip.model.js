/**
 * Created by salho on 17.10.16.
 */
import mongoose from 'mongoose';
mongoose.Promise = global.Promise;
let Schema = mongoose.Schema;

const TripSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  begin: Date,
  end: Date,
  createdAt: {
    type: Date,
    "default": Date.now
  },
  creator: {
    type: Schema.ObjectId,
    required: true,
    ref: 'User'
  },
  pois: [
    {
      type: Schema.Types.ObjectId,
      ref: 'POI'
    }
  ],
  likes: [
    {
      userid: Schema.Types.ObjectId,
      username: String
    }
  ],
  liked: Boolean,
  ratings: [
    {
      userid: Schema.Types.ObjectId,
      username: String,
      rating: Number
    }
  ],
  totalrating: Number,
  rating: Number,
  wants: [
    {
      userid: Schema.Types.ObjectId,
      username: String
    }
  ],
  want: Boolean
});


/**
 * Validations
 */

TripSchema.path('name').validate(function(name) {
  return name != null;
}, 'Name cannot be blank');

TripSchema.path('creator').validate(function(creator) {
  return creator != null;
}, 'Creator must be specified');

TripSchema.statics.load = function(id) {
  return this.findById(id).populate('creator', 'local.username').populate('pois');
};

export default mongoose.model('Trip',TripSchema);
