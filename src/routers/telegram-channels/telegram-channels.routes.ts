import { Router } from "express";
import mongoose from "mongoose";
import {
  ITelegramChannel,
  TelegramChannelModel,
} from "./telegram-channels.model";
import { performAIVerification } from "./telegram-channels.helpers";
import { QueryFilter } from "mongoose";
import { DBCountriesModel, DBPlacesModel } from "../places/places.modal";
import { TelegramChannelCategory } from "./telegram-channels.types";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const {
      place_id,
      country_place_id,
      category,
      verified,
      page = 1,
      limit = 20,
    } = req.query;
    const query: QueryFilter<ITelegramChannel> = { isActive: true };
    if (place_id) query.place_id = place_id.toString();
    if (country_place_id) query.country_place_id = country_place_id.toString();
    if (category)
      query.category =
        category.toString() as unknown as TelegramChannelCategory;
    if (verified !== undefined) {
      const isVerified = verified === "true";
      query.verified = isVerified;
      query.aiVerified = isVerified;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const channels = await TelegramChannelModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalItems = await TelegramChannelModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: {
        channels,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          itemsPerPage: limitNum,
        },
        filters: {
          place_id,
          country_place_id,
          category,
          verified,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching telegram channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch telegram channels",
    });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = [
      {
        value: "dispute",
        label: "Disputes",
        description: "Channels for resolving disputes",
      },
      {
        value: "community",
        label: "Community",
        description: "General community channels",
      },
      {
        value: "auto",
        label: "Auto",
        description: "Automotive related channels",
      },
      {
        value: "moto",
        label: "Moto",
        description: "Motorcycle related channels",
      },
      {
        value: "other",
        label: "Other",
        description: "Other specialized channels",
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
});

router.get("/countries", async (req, res) => {
  try {
    const countryIds = await TelegramChannelModel.distinct("country_place_id", {
      isActive: true,
      country_place_id: { $ne: null },
    });
    const countries = await TelegramChannelModel.populate(countryIds, {
      path: "country_place_id",
      select: "name",
    });
    const countryNames = countries
      .filter((country: any) => country && country.name)
      .map((country: any) => country.name)
      .sort();

    res.json({
      success: true,
      data: countryNames,
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
    });
  }
});

router.get("/cities", async (req, res) => {
  try {
    const { country_place_id } = req.query;
    const query: QueryFilter<ITelegramChannel> = {
      isActive: true,
      place_id: { $ne: null },
    };
    if (country_place_id) query.country_place_id = country_place_id.toString();

    const placeIds = await TelegramChannelModel.distinct("place_id", query);
    const places = await TelegramChannelModel.populate(placeIds, {
      path: "place_id",
      select: "name",
    });
    const cityNames = places
      .filter((place: any) => place && place.name)
      .map((place: any) => place.name)
      .sort();

    res.json({ success: true, data: cityNames });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cities",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      channelUrl,
      category,
      place_id,
      country_place_id,
      addedBy,
    } = req.body;
    if (!name || !channelUrl || !category || !addedBy)
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, channelUrl, category, addedBy",
      });

    const existingChannel = await TelegramChannelModel.findOne({ channelUrl });
    if (existingChannel)
      return res.status(409).json({
        success: false,
        message: "This Telegram channel is already in the database",
      });

    const aiVerificationResult = await performAIVerification(name, description);
    const newChannel = new TelegramChannelModel({
      name,
      description,
      channelUrl,
      category,
      place_id,
      country_place_id,
      verified: false, // Requires manual verification
      aiVerified: aiVerificationResult.isSafe,
      addedBy,
      isActive: aiVerificationResult.isSafe, // Only activate if AI says it's safe
    });

    await newChannel.save();

    return res.status(201).json({
      success: true,
      data: newChannel,
      message: aiVerificationResult.isSafe
        ? "Channel added successfully and is under review"
        : "Channel submitted but requires manual review due to potential concerns",
    });
  } catch (error) {
    console.error("Error adding telegram channel:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add telegram channel",
    });
  }
});

router.post("/:id/report", async (req, res) => {
  try {
    const { id } = req.params;
    const channel = await TelegramChannelModel.findById(id);
    if (!channel)
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });

    channel.reportCount += 1;
    channel.updatedAt = new Date();
    if (channel.reportCount >= 5) {
      channel.isActive = false;
      channel.verified = false;
    }

    await channel.save();

    return res.json({
      success: true,
      message: "Channel reported successfully",
      data: {
        reportCount: channel.reportCount,
        isActive: channel.isActive,
      },
    });
  } catch (error) {
    console.error("Error reporting channel:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to report channel",
    });
  }
});

router.get("/locations/", async (req, res) => {
  try {
    const channels = await TelegramChannelModel.find({
      country_place_id: { $ne: null },
      isActive: true,
    })
      .select("country_place_id place_id")
      .lean();

    const countryIds = new Set<string>();
    const placeIds = new Set<string>();

    channels.forEach((channel) => {
      if (channel.country_place_id)
        countryIds.add(channel.country_place_id.toString());
      if (channel.place_id) placeIds.add(channel.place_id.toString());
    });

    const [countries, places] = await Promise.all([
      DBCountriesModel.find({
        _id: {
          $in: Array.from(countryIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      }).lean(),
      DBPlacesModel.find({
        _id: {
          $in: Array.from(placeIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      }).lean(),
    ]);

    return res.send({
      success: true,
      data: { countries, places },
    });
  } catch (error) {
    console.error("Error fetching telegram channel locations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
    });
  }
});

export default router;
