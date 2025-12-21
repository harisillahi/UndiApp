# ImgBB Setup Guide

Your lottery app now uses **ImgBB** to store images instead of localStorage, which completely solves the 5-prize limitation!

## ✅ What Changed

Images for prizes, door prizes, and backgrounds are now:
- Uploaded to ImgBB cloud storage (free)
- Stored as URLs in localStorage (tiny size)
- No more storage limits!

## 🚀 Quick Start

### Option 1: Use Default Key (Demo - Works Immediately)
The app includes a demo API key that works out of the box. Just deploy and use!

**Limitation**: Shared key, rate limits may apply if heavily used.

### Option 2: Get Your Own Free API Key (Recommended for Production)

1. **Sign up for free**: https://api.imgbb.com/
2. **Get your API key** from the dashboard
3. **Add to your project**:

   Create `.env.local` file in your project root:
   ```
   IMGBB_API_KEY=your_actual_api_key_here
   ```

4. **Deploy to Vercel**:
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add: `IMGBB_API_KEY` with your key value
   - Redeploy

## 📊 ImgBB Free Tier Limits
- ✅ Unlimited image uploads
- ✅ No expiration
- ✅ Direct hotlinking allowed
- ✅ Free forever
- ⚠️ Max 32MB per image
- ⚠️ Rate limit: ~5000 uploads/hour

## 🧪 Testing Locally

1. Run your dev server:
   ```bash
   npm run dev
   ```

2. Upload an image in any prize field
3. Check that it uploads successfully
4. Image URL will be stored instead of base64

## 🔧 How It Works

**Before (localStorage):**
- Image → Base64 → localStorage (5-10MB limit)
- Only ~5 prizes with images

**Now (ImgBB):**
- Image → Compress → Upload to ImgBB → URL stored in localStorage
- URL size: ~50 bytes vs 500KB+ for base64
- **Unlimited prizes with images!**

## 📁 Files Modified

- `src/app/api/upload-image/route.ts` - Upload API endpoint
- `src/lib/utils.ts` - Added `uploadImageToImgBB()` function
- `src/components/PrizeInput.tsx` - Uses ImgBB for grand prizes
- `src/components/DoorPrizeInput.tsx` - Uses ImgBB for door prizes  
- `src/components/LotterySettings.tsx` - Uses ImgBB for backgrounds

## ⚠️ Important Notes

- Images are still compressed before upload (saves bandwidth)
- No need to upgrade Vercel to Pro
- Works in both local development and production
- Images remain accessible even after clearing localStorage

## 🆘 Troubleshooting

**Upload fails?**
- Check browser console for errors
- Verify image file is < 2MB
- Try with a different image format (JPG/PNG)

**Rate limited?**
- Get your own API key (option 2 above)
- Or reduce upload frequency

**Images not loading?**
- Check network tab for 404s
- Verify ImgBB service is up: https://status.imgbb.com/

---

**You're all set!** No more 5-prize limitation. Deploy and enjoy unlimited prizes! 🎉
