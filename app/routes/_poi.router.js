/**
 * Created by salho on 13.10.16.
 */
import * as poi from '../controllers/poi.controller';
import multipart from 'connect-multiparty';
const multipartMiddleware = multipart();

const isOwner = (req,res,next) =>
  req.poi.creator.local.username === req.user.username || req.user.roles.includes('admin') ?
    next():
    res.status(403).json({message: "You are not allowed to change somebody else's POI"})

export default (app, router, auth, admin) => {
  router.post('/poi',auth,poi.create,poi.show);
  router.get('/poi',auth,poi.all);
  router.get('/poi/mine',auth,poi.mine);
  router.get('/poi/image/:imageId',auth,poi.image);
  router.param('poiId',poi.load);
  router.get('/poi/:poiId',auth,poi.show);
  router.patch('/poi/:poiId',auth,isOwner,poi.update,poi.show);
  router.delete('/poi/:poiId',auth,isOwner,poi.destroy,poi.show);
  router.post('/poi/:poiId/image',auth,multipartMiddleware,poi.addImage);
  router.patch('/poi/:poiId/like',auth,poi.like,poi.show);
  router.patch('/poi/:poiId/rate',auth,poi.rate,poi.show);
}
