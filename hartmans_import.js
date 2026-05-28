// hartmans_import.js
// Run: node hartmans_import.js
// Requires: npm install @supabase/supabase-js

import { createClient } from "@supabase/supabase-js";

// ── CONFIG ────────────────────────────────────────────────
const SUPABASE_URL = "https://vfqbioksbylatydjqdhg.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmcWJpb2tzYnlsYXR5ZGpxZGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NzExNCwiZXhwIjoyMDg2NTYzMTE0fQ.Y_eTTNGSK1fpHOyZ4q1V0-OFLyaIPCAa9aMHOIvlScU"; // service role — never commit this
const HARTMANS_VENUE_ID = "48494eb2-0357-4ecc-9842-fcaab30a262f";

// ── WHISKEY TYPE IDs ──────────────────────────────────────
const TYPE = {
  BOURBON:         "85050bc9-99b4-469a-84a2-dc3abf7ed1d0",
  RYE:             "d20cf63e-5736-4572-9c23-6f899b216a57",
  TENNESSEE:       "bffb54e3-cabc-4e67-8024-78ded8475343",
  AMERICAN:        "0cac00fc-a7ab-4c0a-894a-c40bdd25fdc7",
  SINGLE_MALT:     "9349cb96-a41d-42f2-b98e-e2d11aa346a8",
  BLENDED_SCOTCH:  "999f58bb-d56f-4f44-9d27-c184ab6b4eb5",
  OTHER:           "3cde1227-e497-4a47-ba53-cb21d5d7b506",
};

// ── HARTMAN'S MENU DATA ───────────────────────────────────
// [name, proof_or_null, region, distillery, whiskey_type_id, price_1oz_cents, price_2oz_cents_or_null]
const MENU = [
  // Buffalo Trace
  ["Buffalo Trace", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, null],
  ["Buffalo Trace HDC Barrel Pick", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1400],
  ["Travelers Chris Stapleton", 94, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1400],
  ["Eagle Rare 10 Year", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1200, null],
  ["E.H. Taylor Small Batch", 100, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1500, null],
  ["E.H. Taylor Single Barrel", 100, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1800],
  ["E.H. Taylor Barrel Proof Batch 12", 131.1, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1500, 2600],
  ["Hancock's Reserve Single Barrel", 88.9, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 2000],
  ["Buffalo Trace Single Oak Project", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1800, 3200],
  ["Elmer T. Lee Single Barrel", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1200, 2000],
  ["Rock Hill Farms Single Barrel", 100, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1200, 2400],
  ["Blanton's Single Barrel", 93, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1200, null],
  ["Blanton's Straight from the Barrel", 123, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2000, 4000],
  ["Blanton's Gold", 103, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1800, 3600],
  ["Old Charter Oak French Oak", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1800, 3600],
  ["Weller Special Reserve", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1200, null],
  ["Weller Antique 107", 107, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1600],
  ["Weller 12 Year", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1600],
  ["Weller Full Proof", 114, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1400, 2400],
  ["Weller CYPB", 95, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1600, 3000],
  ["Weller Single Barrel", 97, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2000, 3600],
  ["Weller Special Reserve Old Label", 90, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2000, 3500],
  ["Stagg 127.4 Proof", 127.4, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1800],
  ["Stagg 128.9 Proof", 128.9, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1800],
  ["Stagg 130 Proof", 130, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1800],
  ["Stagg 131 Proof", 131, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1000, 1800],
  ["George T. Stagg 136.1 Proof", 136.1, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2500, 5000],
  ["George T. Stagg 135 Proof", 135, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2500, 5000],
  ["George T. Stagg 138.7 Proof", 138.7, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2500, 5000],
  ["William Larue Weller 133.6 Proof", 133.6, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 3000, 6000],
  ["Eagle Rare 17 Year", 101, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 5000, 9000],
  ["Old Rip Van Winkle 10 Year", 107, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 1600, 3000],
  ["Van Winkle Family Reserve 12 Year", 90.4, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 2200, 4000],
  ["Pappy Van Winkle 15 Year", 107, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 5000, 9000],
  ["Pappy Van Winkle 20 Year", 90.4, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 7500, 15000],
  ["Pappy Van Winkle 23 Year", 95.6, "Kentucky", "Buffalo Trace Distillery", TYPE.BOURBON, 9500, 19000],
  // Heaven Hill
  ["Quality House Bourbon", 80, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["JW Dant 100 Proof", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Evan Williams 1783 86 Proof", 86, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Evan Williams 1783 90 Proof", 90, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Evan Williams Bottled in Bond", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Evan Williams Bottled in Bond 7 Year", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1200, null],
  ["Heaven Hill BiB 6 Year White Label", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 2000],
  ["Henry McKenna 80 Proof", 80, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Henry McKenna 10 Year", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1500, null],
  ["Larceny Small Batch 92 Proof", 92, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Larceny Barrel Proof A122", 124.4, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1500],
  ["Larceny Barrel Proof B524", 125.4, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1500],
  ["Elijah Craig Small Batch", 94, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Elijah Craig Barrel Proof A125", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Elijah Craig Barrel Proof B522", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Elijah Craig Barrel Proof C924", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Elijah Craig Barrel Proof C922", 124.8, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1600],
  ["Elijah Craig Barrel Proof C923", 133, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1600],
  ["Elijah Craig Barrel Proof B524", 130.6, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1600],
  ["Elijah Craig 18 Year", 90, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1500, 2500],
  ["Old Fitzgerald 80 Proof", 80, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, null],
  ["Old Fitzgerald 7 Year Bottled in Bond", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1500],
  ["Old Fitzgerald 9 Year Fall 2018", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 2500, 4500],
  ["Old Fitzgerald 10 Year Spring 2013", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 2500, 4500],
  ["Old Fitzgerald 11 Year Fall 2024", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 2500, 4500],
  ["Old Fitzgerald 19 Year Fall 2022", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3000, 6000],
  ["Grain to Glass Bourbon", 90, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1800],
  ["Grain to Glass Wheated Bourbon", 90, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1000, 1800],
  ["Select Stock 2024 Sherry Cask", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 1500, 3000],
  ["Parker's Heritage 11 Year Heavy Char", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3000, 6000],
  ["Parker's Heritage 10 Year Heavy Char", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3000, 6000],
  ["Parker's Heritage 14 Year Toasted Cognac", null, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3000, 6000],
  ["Parker's Heritage 24 Year 100 Proof", 100, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3000, 6000],
  ["Heaven Hill 18 Year", 90, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3500, 7000],
  ["Heaven Hill 19 Year", 90, "Kentucky", "Heaven Hill Distillery", TYPE.BOURBON, 3500, 7000],
  // Woodford Reserve
  ["Woodford Reserve Double Oaked", 90.4, "Kentucky", "Woodford Reserve Distillery", TYPE.BOURBON, 1200, null],
  ["Woodford Reserve Double Double Oaked", 90.4, "Kentucky", "Woodford Reserve Distillery", TYPE.BOURBON, 1200, 2000],
  ["Woodford Reserve Masters Collection Madeira Cask", 90.4, "Kentucky", "Woodford Reserve Distillery", TYPE.BOURBON, 1200, 2000],
  ["Woodford Reserve Masters Collection Triple Sonoma Cask", 90.4, "Kentucky", "Woodford Reserve Distillery", TYPE.BOURBON, 1200, 2000],
  ["Woodford Reserve Baccarat Edition", 90.4, "Kentucky", "Woodford Reserve Distillery", TYPE.BOURBON, 7000, 14000],
  // Maker's Mark
  ["Maker's Mark", 90, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1000, null],
  ["Maker's Mark 46", 94, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1200, null],
  ["Maker's Mark Wood Finishing Series FAE-01", null, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1000, 1800],
  ["Maker's Mark Wood Finishing Series BEP", null, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1000, 1800],
  ["Maker's Mark The Heart Release 2024", null, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1200, 2400],
  ["Maker's Mark Cellar Aged 2024", 119.3, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1200, 2400],
  ["Maker's Mark The Keepers Release 2025", null, "Kentucky", "Maker's Mark Distillery", TYPE.BOURBON, 1200, 2400],
  // Wild Turkey
  ["Wild Turkey 101", 101, "Kentucky", "Wild Turkey Distillery", TYPE.BOURBON, 1200, null],
  ["Wild Turkey 8 Year 70th Anniversary", null, "Kentucky", "Wild Turkey Distillery", TYPE.BOURBON, 1000, 1800],
  ["Wild Turkey Longbranch", 86, "Kentucky", "Wild Turkey Distillery", TYPE.BOURBON, 1000, 1800],
  ["Russell's Reserve 13 Year", null, "Kentucky", "Wild Turkey Distillery", TYPE.BOURBON, 1800, 3400],
  ["Russell's Reserve Single Rickhouse", null, "Kentucky", "Wild Turkey Distillery", TYPE.BOURBON, 1800, 3400],
  // Four Roses
  ["Four Roses Yellow Label", 80, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 1000, null],
  ["Four Roses Small Batch", 90, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 1200, null],
  ["Four Roses Small Batch Select", 104, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 1600, null],
  ["Four Roses Single Barrel 100 Proof", 100, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 1000, 1800],
  ["Four Roses Single Barrel New York Any", 100, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 1500, 2500],
  ["Four Roses Limited Edition 2020", 111.4, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 2500, 5000],
  ["Four Roses Limited Edition 2021", 114.2, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 2500, 5000],
  ["Four Roses Limited Edition 2023 135th Anniversary", 108, "Kentucky", "Four Roses Distillery", TYPE.BOURBON, 2500, 5000],
  // Willett
  ["Rowan's Creek Bourbon", 100.1, "Kentucky", "Willett Distillery", TYPE.BOURBON, 1200, null],
  ["Old Bardstown Bourbon", 90, "Kentucky", "Willett Distillery", TYPE.BOURBON, 1200, null],
  ["Noah's Mill Bourbon", 114.3, "Kentucky", "Willett Distillery", TYPE.BOURBON, 1200, null],
  ["Pure Kentucky XO", 107.2, "Kentucky", "Willett Distillery", TYPE.BOURBON, 1200, null],
  ["Kentucky Vintage Bourbon", 90, "Kentucky", "Willett Distillery", TYPE.BOURBON, 1200, null],
  ["Willett Pot Still Reserve", 94, "Kentucky", "Willett Distillery", TYPE.BOURBON, 1500, null],
  // Old Forester
  ["Old Forester 86 Proof", 86, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1000, null],
  ["Old Forester 100 Proof", 100, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1200, null],
  ["Old Forester Statesman", 95, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1500, null],
  ["Old Forester 1870 Original Batch", 90, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1500, null],
  ["Old Forester 1910 Old Fine Whisky", 93, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1500, null],
  ["Old Forester 1920 Prohibition Style", 115, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1000, 1500],
  ["Old Forester 1897 Bottled in Bond", 100, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1500, null],
  ["Old Forester 1924 10 Year", null, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1000, 1800],
  ["Old Forester Experimental 117 Rum Finish", 117, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1600, 3000],
  // Lux Row
  ["David Nicholson 1843", 80, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1000, null],
  ["David Nicholson Reserve", 100, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1000, null],
  ["Ezra Brooks Black 90 Proof", 90, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1000, null],
  ["Ezra Brooks 99 Proof", 99, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1000, null],
  ["Rebel Yell 80 Proof", 80, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1000, null],
  ["Rebel Yell 6 Year 100 Proof", 100, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1200, null],
  ["Rebel Yell 10 Year", 90, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1500, null],
  ["Rebel Yell 10 Year Single Barrel", 90, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 1500, null],
  ["Orphan Barrel Fanged Pursuit", null, "Kentucky", "Lux Row Distillers", TYPE.BOURBON, 2000, 3500],
  // Michter's
  ["Michter's Small Batch Bourbon", 91.4, "Kentucky", "Michter's Distillery", TYPE.BOURBON, 1000, null],
  ["Michter's Sour Mash Whiskey", 86, "Kentucky", "Michter's Distillery", TYPE.AMERICAN, 1500, null],
  ["Michter's Barrel Strength Bourbon", null, "Kentucky", "Michter's Distillery", TYPE.BOURBON, 1200, 2000],
  ["Michter's Toasted Barrel Finish Bourbon", 91.4, "Kentucky", "Michter's Distillery", TYPE.BOURBON, 1200, 2000],
  ["Michter's 10 Year Bourbon", 94.4, "Kentucky", "Michter's Distillery", TYPE.BOURBON, 1500, 2500],
  ["Shenk's Homestead Sour Mash 2023", null, "Kentucky", "Michter's Distillery", TYPE.AMERICAN, 1000, 2000],
  ["Bomberger's Declaration 2024", null, "Kentucky", "Michter's Distillery", TYPE.BOURBON, 1200, 2400],
  ["Michter's 20 Year Bourbon", null, "Kentucky", "Michter's Distillery", TYPE.BOURBON, 9500, 18000],
  // Barton
  ["Barton's Bourbon", 80, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, null],
  ["Very Old Barton", 90, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, null],
  ["1792 Small Batch Bourbon", 93.7, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, null],
  ["1792 Single Barrel Bourbon", 98.6, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, null],
  ["1792 Full Proof Bourbon", 125, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, 1500],
  ["1792 Bottled in Bond", 100, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1200, null],
  ["1792 Sweet Wheat", 91.2, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, 1500],
  ["Thomas S. Moore Bourbon", 95, "Kentucky", "Barton 1792 Distillery", TYPE.BOURBON, 1000, 1400],
  // Jim Beam
  ["Jim Beam Black Extra Aged", 86, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, null],
  ["Jim Beam Devil's Cut", 90, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, null],
  ["Old Tub Bottled in Bond", 100, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, null],
  ["Basil Hayden 80 Proof", 80, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1200, null],
  ["Basil Hayden Subtle Smoke", 80, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1200, null],
  ["Basil Hayden Toast", 80, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1200, null],
  ["Basil Hayden 10 Year", 80, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1400, 2800],
  ["Baker's 7 Year 107 Proof", 107, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, 1600],
  ["Booker's Bourbon", 125, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, 1800],
  ["Little Book The Infinite 2024", null, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1200, 2000],
  ["Little Book 2025", null, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1200, 2000],
  ["Old Grand-Dad Bourbon", 80, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, null],
  ["Old Grand-Dad 114 Proof", 114, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, null],
  ["Old Grand-Dad 16 Year", null, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, 1500],
  ["Knob Creek 9 Year", 100, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1200, null],
  ["Knob Creek 12 Year", 100, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1000, 1800],
  ["Knob Creek 18 Year", 100, "Kentucky", "Jim Beam Distillery", TYPE.BOURBON, 1500, 2500],
  // Other Kentucky
  ["American Highway Reserve Bourbon", null, "Kentucky", null, TYPE.BOURBON, 1000, 1800],
  ["American Barrels Bourbon", null, "Kentucky", null, TYPE.BOURBON, 1000, null],
  ["Angel's Envy Bourbon", 86.6, "Kentucky", "Louisville Distilling Company", TYPE.BOURBON, 1200, null],
  ["Angel's Envy Cask Strength", null, "Kentucky", "Louisville Distilling Company", TYPE.BOURBON, 1200, 2000],
  ["Angel's Envy Triple Oaked", null, "Kentucky", "Louisville Distilling Company", TYPE.BOURBON, 1000, 1800],
  ["Angel's Envy Private Select", null, "Kentucky", "Louisville Distilling Company", TYPE.BOURBON, 1200, 1600],
  ["Barrell Cask Strength 111.2 Proof", 111.2, "Kentucky", "Barrell Craft Spirits", TYPE.BOURBON, 1000, 1500],
  ["Bardstown Bourbon Company Origins", null, "Kentucky", "Bardstown Bourbon Company", TYPE.BOURBON, 1400, null],
  ["Bardstown Bourbon Company Fusion", null, "Kentucky", "Bardstown Bourbon Company", TYPE.BOURBON, 1000, 1500],
  ["Bardstown Bourbon Company Discovery", null, "Kentucky", "Bardstown Bourbon Company", TYPE.BOURBON, 1000, 1500],
  ["Bardstown Bourbon Company Silveroak", null, "Kentucky", "Bardstown Bourbon Company", TYPE.BOURBON, 1000, 1500],
  ["Bardstown Bourbon Company Stout Finish", null, "Kentucky", "Bardstown Bourbon Company", TYPE.BOURBON, 1000, 1500],
  ["Blue Run Trifecta", null, "Kentucky", "Blue Run Spirits", TYPE.BOURBON, 1200, 2000],
  ["Blue Run Reflection", null, "Kentucky", "Blue Run Spirits", TYPE.BOURBON, 1200, 2000],
  ["Boondocks Port Finish", 90, "Kentucky", null, TYPE.BOURBON, 1000, 1500],
  ["Bulleit 10 Year Bourbon", 91.2, "Kentucky", "Bulleit Distilling Co.", TYPE.BOURBON, 1500, null],
  ["Cabin Still Bourbon", 80, "Kentucky", null, TYPE.BOURBON, 1000, null],
  ["Corner Creek Small Batch", null, "Kentucky", null, TYPE.BOURBON, 1000, 1500],
  ["Duke Bourbon", null, "Kentucky", null, TYPE.BOURBON, 1000, null],
  ["Duke Founder's Reserve 110 Proof", 110, "Kentucky", null, TYPE.BOURBON, 1000, 1800],
  ["Green River Bourbon", 86, "Kentucky", "Green River Distilling Co.", TYPE.BOURBON, 1200, null],
  ["Green River Wheated Bourbon", 86, "Kentucky", "Green River Distilling Co.", TYPE.BOURBON, 1200, null],
  ["Green River Full Proof Bourbon", null, "Kentucky", "Green River Distilling Co.", TYPE.BOURBON, 1000, 1500],
  ["Early Times Bourbon", 80, "Kentucky", null, TYPE.BOURBON, 1500, null],
  ["Hirsch Horizon Bourbon", null, "Kentucky", null, TYPE.BOURBON, 1000, null],
  ["IW Harper Bourbon", 82, "Kentucky", null, TYPE.BOURBON, 1000, null],
  ["James E. Pepper 1776 Bourbon", 100, "Kentucky", "James E. Pepper Distillery", TYPE.BOURBON, 1000, null],
  ["Jefferson's Reserve Prichard Hill", null, "Kentucky", "Jefferson's Bourbon", TYPE.BOURBON, 1000, 2000],
  ["Jefferson's Reserve Chateau Pichon Baron", null, "Kentucky", "Jefferson's Bourbon", TYPE.BOURBON, 1000, 2000],
  ["Kentucky Owl Confiscated", null, "Kentucky", "Kentucky Owl", TYPE.BOURBON, 1000, 1600],
  ["Kentucky Owl Maighstir", null, "Kentucky", "Kentucky Owl", TYPE.BOURBON, 1000, 1600],
  ["New Riff Bottled in Bond", 100, "Kentucky", "New Riff Distilling", TYPE.BOURBON, 1400, null],
  ["New Riff Single Barrel Bourbon", null, "Kentucky", "New Riff Distilling", TYPE.BOURBON, 1000, 1600],
  ["Old Pogue Bourbon", null, "Kentucky", "Old Pogue Distillery", TYPE.BOURBON, 1000, 1500],
  ["Peerless Small Batch Bourbon", null, "Kentucky", "Kentucky Peerless Distilling Co.", TYPE.BOURBON, 1000, 1500],
  ["Penelope Estate Collection 9 Year", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Penelope Estate Collection 10 Year", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Penelope Four Grain Bourbon", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Penelope Havana Finish", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Penelope Architect", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Penelope Barrel Strength", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Penelope Toasted", null, "Kentucky", "Penelope Bourbon", TYPE.BOURBON, 1000, 1500],
  ["Pinhook 2022 High Proof 116", 116, "Kentucky", "Pinhook Bourbon", TYPE.BOURBON, 1000, 1600],
  ["Pinhook 6 Year 107 Proof", 107, "Kentucky", "Pinhook Bourbon", TYPE.BOURBON, 1000, 1800],
  ["Puncher's Chance Bourbon", null, "Kentucky", "Puncher's Chance", TYPE.BOURBON, 1000, null],
  ["Puncher's Chance The D12tance 12 Year", null, "Kentucky", "Puncher's Chance", TYPE.BOURBON, 1000, 1500],
  ["Rabbit Hole Blackened Bourbon", null, "Kentucky", "Rabbit Hole Distillery", TYPE.BOURBON, 1000, 1600],
  ["Ruddell's Mill Small Batch", null, "Kentucky", null, TYPE.BOURBON, 1200, null],
  ["Seelbach's Bourbon", null, "Kentucky", null, TYPE.BOURBON, 1200, 2000],
  ["Seelbach's 15 Year Bourbon", null, "Kentucky", null, TYPE.BOURBON, 2000, 3500],
  ["Stellum Bourbon Kentucky", null, "Kentucky", "Barrell Craft Spirits", TYPE.BOURBON, 1200, null],
  ["Yellowstone Select 2020", null, "Kentucky", "Limestone Branch Distillery", TYPE.BOURBON, 1200, null],
  // Tennessee
  ["Jesse James Bourbon", 80, "Tennessee", null, TYPE.TENNESSEE, 1000, null],
  ["Heaven's Door Straight Bourbon", 92, "Tennessee", "Heaven's Door Spirits", TYPE.TENNESSEE, 1000, null],
  ["Heaven's Door Exploration Series", null, "Tennessee", "Heaven's Door Spirits", TYPE.TENNESSEE, 1000, 1600],
  ["Heaven's Door Ascension Series", null, "Tennessee", "Heaven's Door Spirits", TYPE.TENNESSEE, 1200, null],
  ["Nelson's Green Brier Tennessee Whiskey", 91, "Tennessee", "Nelson's Green Brier Distillery", TYPE.TENNESSEE, 1200, null],
  ["Nelson Brothers Reserve", 107.8, "Tennessee", "Nelson's Green Brier Distillery", TYPE.TENNESSEE, 1200, null],
  ["Uncle Nearest 1856 Premium Whiskey", 100, "Tennessee", "Uncle Nearest Premium Whiskey", TYPE.TENNESSEE, 1200, null],
  ["Uncle Nearest Small Batch", 95, "Tennessee", "Uncle Nearest Premium Whiskey", TYPE.TENNESSEE, 1200, null],
  ["Jack Daniel's 10 Year", null, "Tennessee", "Jack Daniel's Distillery", TYPE.TENNESSEE, 1000, 2000],
  ["Jack Daniel's 12 Year", null, "Tennessee", "Jack Daniel's Distillery", TYPE.TENNESSEE, 1400, 2800],
  // New York
  ["Black Dirt Bourbon", 80, "New York", "Black Dirt Distillery", TYPE.BOURBON, 1000, null],
  ["Black Dirt Cask Strength 5 Year", null, "New York", "Black Dirt Distillery", TYPE.BOURBON, 1200, null],
  ["Cooperstown Doubleday Bourbon", null, "New York", "Cooperstown Distillery", TYPE.BOURBON, 1000, null],
  ["Cooperstown Select Bourbon", null, "New York", "Cooperstown Distillery", TYPE.BOURBON, 1400, null],
  ["Cooperstown Springfield Bourbon", null, "New York", "Cooperstown Distillery", TYPE.BOURBON, 1400, null],
  ["Cooperstown Canton Bourbon", null, "New York", "Cooperstown Distillery", TYPE.BOURBON, 1400, null],
  ["Field & Sound Bottled in Bond", 100, "New York", null, TYPE.BOURBON, 1200, null],
  ["Great Jones Jean-Michel Basquiat Edition", null, "New York", "Great Jones Distilling Co.", TYPE.BOURBON, 1000, null],
  ["Great Jones Wolffer Estate Cab Cask", null, "New York", "Great Jones Distilling Co.", TYPE.BOURBON, 1400, null],
  ["Hartman's Distilling Co. Straight Blended Whiskey", null, "New York", "Hartman's Distilling Company", TYPE.AMERICAN, 1200, null],
  ["Hudson Bright Lights Big Bourbon", 92, "New York", "Tuthilltown Spirits", TYPE.BOURBON, 1000, null],
  ["Ironweed Bourbon", null, "New York", null, TYPE.BOURBON, 1000, null],
  ["Iron Smoke Straight Bourbon", 80, "New York", "Iron Smoke Distillery", TYPE.BOURBON, 1000, null],
  ["Iron Smoke Cask Strength", null, "New York", "Iron Smoke Distillery", TYPE.BOURBON, 1500, null],
  ["Iron Smoke Bottled in Bond", 100, "New York", "Iron Smoke Distillery", TYPE.BOURBON, 1000, null],
  ["Lone Logger's Bourbon", null, "New York", null, TYPE.BOURBON, 1000, null],
  ["Southern Tier Smoked Bourbon", null, "New York", "Southern Tier Distilling", TYPE.BOURBON, 1000, null],
  ["Southern Tier Bottled-in-Bond Bourbon", 100, "New York", "Southern Tier Distilling", TYPE.BOURBON, 1000, null],
  ["Southern Tier Single Cask Bourbon", null, "New York", "Southern Tier Distilling", TYPE.BOURBON, 1500, null],
  ["Steelbound Bourbon", null, "New York", null, TYPE.BOURBON, 1000, null],
  ["Taconic Private Reserve", null, "New York", "Taconic Distillery", TYPE.BOURBON, 1000, null],
  ["Taconic Double Maple Cask", null, "New York", "Taconic Distillery", TYPE.BOURBON, 1000, null],
  ["Taconic Double Mizunara Cask", null, "New York", "Taconic Distillery", TYPE.BOURBON, 1400, null],
  ["Taconic Barrel Strength", null, "New York", "Taconic Distillery", TYPE.BOURBON, 1400, null],
  ["Taconic Duchess Reserve", null, "New York", "Taconic Distillery", TYPE.BOURBON, 1000, null],
  ["Taconic 10th Anniversary", null, "New York", "Taconic Distillery", TYPE.BOURBON, 1500, null],
  ["Horse & Jockey Bourbon", null, "New York", null, TYPE.BOURBON, 1000, null],
  ["Fox & Hare Bourbon", null, "New York", null, TYPE.BOURBON, 1000, null],
  ["Tommyrotter Napa Valley Cask Bourbon", null, "New York", "Tommyrotter Distillery", TYPE.BOURBON, 1000, null],
  ["Widow Jane 10 Year", null, "New York", "Widow Jane Distillery", TYPE.BOURBON, 1400, null],
  ["Widow Jane The Vault 2020 15 Year", null, "New York", "Widow Jane Distillery", TYPE.BOURBON, 1000, 2000],
  // Rye
  ["Devil's River Rye", null, "Texas", "Devil's River Whiskey", TYPE.RYE, 1000, null],
  ["Templeton 6 Year Rye", 92, "Iowa", "Templeton Rye Spirits", TYPE.RYE, 1000, null],
  ["Templeton Extra Anejo Rye", null, "Iowa", "Templeton Rye Spirits", TYPE.RYE, 1000, null],
  ["Brothers Bond Rye", null, null, "Brothers Bond Bourbon", TYPE.RYE, 1000, null],
  ["Maysville Club Rye", null, "Kentucky", null, TYPE.RYE, 1000, null],
  ["Stellum Rye", null, "Kentucky", "Barrell Craft Spirits", TYPE.RYE, 1000, null],
  ["New Riff Rye", 100, "Kentucky", "New Riff Distilling", TYPE.RYE, 1000, null],
  ["Old Forester Rye", 100, "Kentucky", "Old Forester Distillery", TYPE.RYE, 1000, null],
  ["Old Overholt 11 Year Rye", null, "Kentucky", "Jim Beam Distillery", TYPE.RYE, 1000, 1800],
  ["Hillrock Double Cask Rye", null, "New York", "Hillrock Estate Distillery", TYPE.RYE, 1600, null],
  ["Jack Daniel's Single Barrel Rye", null, "Tennessee", "Jack Daniel's Distillery", TYPE.RYE, 1600, null],
  ["Jack Daniel's Twice Barreled Rye", null, "Tennessee", "Jack Daniel's Distillery", TYPE.RYE, 1000, 1800],
  ["Willett 4 Year Rare Release Rye", null, "Kentucky", "Willett Distillery", TYPE.RYE, 1000, 1800],
  ["Midwinter Night's Dram Act 10", null, "Colorado", "High West Distillery", TYPE.RYE, 1400, 2800],
  ["Michter's 10 Year Rye", null, "Kentucky", "Michter's Distillery", TYPE.RYE, 1500, 2800],
  ["Thomas Handy Sazerac Rye 129.5 Proof", 129.5, "Kentucky", "Buffalo Trace Distillery", TYPE.RYE, 1500, 2800],
  ["Parker's Heritage Rye 10 Year", null, "Kentucky", "Heaven Hill Distillery", TYPE.RYE, 1500, 2800],
  ["Van Winkle Family Reserve Rye 13 Year", null, "Kentucky", "Buffalo Trace Distillery", TYPE.RYE, 2400, 4800],
  ["WhistlePig Boss Hog XII", null, "Vermont", "WhistlePig Whiskey", TYPE.RYE, 3200, 6000],
  // Scotch
  ["Balvenie 14 Year Caribbean Cask", 86, "Scotland", "The Balvenie Distillery", TYPE.SINGLE_MALT, 1200, 2000],
  ["Macallan 12 Year Double Cask", 86, "Scotland", "The Macallan Distillery", TYPE.SINGLE_MALT, 1500, 2800],
  // Other States
  ["Balcones Texas Single Malt", null, "Texas", "Balcones Distilling", TYPE.AMERICAN, 1000, 1500],
  ["Ben Holladay 6 Year Missouri Bourbon", null, "Missouri", "Ben Holladay Distillery", TYPE.BOURBON, 1000, null],
  ["Ben Holladay Bottled in Bond Missouri", null, "Missouri", "Ben Holladay Distillery", TYPE.BOURBON, 1200, null],
  ["Big Stick Florida Bourbon", null, "Florida", null, TYPE.BOURBON, 1000, null],
  ["Black Maple Hill Small Batch Washington", null, "Washington", null, TYPE.BOURBON, 1500, null],
  ["Bower Hill Single Barrel Ohio", null, "Ohio", "Bower Hill Distillery", TYPE.BOURBON, 1200, null],
  ["Bower Hill Barrel Reserve Ohio", null, "Ohio", "Bower Hill Distillery", TYPE.BOURBON, 1200, null],
  ["Bower Hill Special Edition Ohio", null, "Ohio", "Bower Hill Distillery", TYPE.BOURBON, 1200, null],
  ["Bower Hill Sherry Cask Finish Ohio", null, "Ohio", "Bower Hill Distillery", TYPE.BOURBON, 1200, null],
  ["Bower Hill Barrel Strength Ohio", null, "Ohio", "Bower Hill Distillery", TYPE.BOURBON, 1800, null],
  ["Bowman Brothers Virginia Bourbon", 90, "Virginia", "A. Smith Bowman Distillery", TYPE.BOURBON, 1000, null],
  ["Bowman Isaac Port Finish Virginia", null, "Virginia", "A. Smith Bowman Distillery", TYPE.BOURBON, 1200, null],
  ["Bowman John 100 Proof Virginia", 100, "Virginia", "A. Smith Bowman Distillery", TYPE.BOURBON, 1000, null],
  ["Bowman Single Barrel 100 Proof Virginia", 100, "Virginia", "A. Smith Bowman Distillery", TYPE.BOURBON, 1200, null],
  ["Breckenridge Rum Cask Finish Colorado", null, "Colorado", "Breckenridge Distillery", TYPE.BOURBON, 1000, null],
  ["Brothers Bond Cask Strength 115.8 Proof", 115.8, null, "Brothers Bond Bourbon", TYPE.BOURBON, 1600, null],
  ["Brothers Bond Regenerative Grain", null, null, "Brothers Bond Bourbon", TYPE.BOURBON, 1600, null],
  ["Devil's River Barrel Strength 117 Proof Texas", 117, "Texas", "Devil's River Whiskey", TYPE.BOURBON, 1200, null],
  ["Devil's River Distillers Select 120 Proof Texas", 120, "Texas", "Devil's River Whiskey", TYPE.BOURBON, 1400, null],
  ["Doc Holliday 10 Year Georgia", null, "Georgia", null, TYPE.BOURBON, 1400, null],
  ["Douglas & Todd Bourbon", null, null, null, TYPE.BOURBON, 1000, null],
  ["Fist Full of Bourbon New Jersey", null, "New Jersey", null, TYPE.BOURBON, 1000, null],
  ["Garrison Brothers Single Barrel Texas", null, "Texas", "Garrison Brothers Distillery", TYPE.BOURBON, 1200, null],
  ["Garrison Brothers Balmorhea Texas", null, "Texas", "Garrison Brothers Distillery", TYPE.BOURBON, 1000, 1500],
  ["Garrison Brothers Laguna Madre Texas", null, "Texas", "Garrison Brothers Distillery", TYPE.BOURBON, 1200, 2000],
  ["Garrison Brothers Honey Dew Texas", null, "Texas", "Garrison Brothers Distillery", TYPE.BOURBON, 1200, null],
  ["Garrison Brothers Small Batch Texas", null, "Texas", "Garrison Brothers Distillery", TYPE.BOURBON, 1200, null],
  ["Garrison Brothers Ladybird Texas", null, "Texas", "Garrison Brothers Distillery", TYPE.BOURBON, 1200, 2000],
  ["Hillbilly Bourbon", 86, null, null, TYPE.BOURBON, 1200, null],
  ["Horse Soldier Small Batch Ohio", null, "Ohio", "Horse Soldier Distillery", TYPE.BOURBON, 1000, null],
  ["Jimmy Red Bottled in Bond 10th Anniversary", null, null, null, TYPE.BOURBON, 2000, 3500],
  ["Journeyman Featherbone Michigan", null, "Michigan", "Journeyman Distillery", TYPE.BOURBON, 1000, null],
  ["Koval Illinois Bourbon", null, "Illinois", "Koval Distillery", TYPE.BOURBON, 1200, null],
  ["Milam & Greene 13 Year Castle Hill Texas", null, "Texas", "Milam & Greene Whiskey", TYPE.BOURBON, 1000, null],
  ["Milam & Greene Unabridged Texas", null, "Texas", "Milam & Greene Whiskey", TYPE.BOURBON, 1000, 1400],
  ["Milam & Greene Single Barrel Texas", null, "Texas", "Milam & Greene Whiskey", TYPE.BOURBON, 1000, 1400],
  ["Milam & Greene Bottled in Bond Texas", null, "Texas", "Milam & Greene Whiskey", TYPE.BOURBON, 1000, 1400],
  ["Milam & Greene The Answer Kentucky Texas", null, "Texas", "Milam & Greene Whiskey", TYPE.BOURBON, 1000, 1400],
  ["Old Elk Wheated Colorado", null, "Colorado", "Old Elk Distillery", TYPE.BOURBON, 1000, null],
  ["Redwood Empire California Bourbon", null, "California", "Redwood Empire Whiskey", TYPE.BOURBON, 1000, null],
  ["Remus Repeal Reserve Bourbon", null, "Indiana", "MGP Ingredients", TYPE.BOURBON, 1000, null],
  ["Remus Babe Ruth Edition", null, "Indiana", "MGP Ingredients", TYPE.BOURBON, 1200, 2000],
  ["Rudder's Mill Bourbon", null, null, null, TYPE.BOURBON, 1000, null],
  ["Savage & Cook Cask Finish California", null, "California", null, TYPE.BOURBON, 1200, null],
  ["Burning Chair California Bourbon", null, "California", null, TYPE.BOURBON, 1000, null],
  ["Smooth Ambler Contradiction West Virginia", null, "West Virginia", "Smooth Ambler Spirits", TYPE.BOURBON, 1000, null],
  ["Smuggler's Notch Batch 64 Vermont", null, "Vermont", "Smuggler's Notch Distillery", TYPE.BOURBON, 1000, null],
  ["Smuggler's Notch Batch 15 Vermont", null, "Vermont", "Smuggler's Notch Distillery", TYPE.BOURBON, 1000, null],
  ["Straight Edge 94 Proof California", 94, "California", null, TYPE.BOURBON, 1000, null],
  ["Southern Star North Carolina Bourbon", null, "North Carolina", null, TYPE.BOURBON, 1000, null],
  ["Southern Star Bottled in Bond Wheated North Carolina", null, "North Carolina", null, TYPE.BOURBON, 1200, null],
  ["Southern Star Cask Strength Wheated North Carolina", null, "North Carolina", null, TYPE.BOURBON, 1500, null],
  ["The Clover 92 Proof North Carolina", 92, "North Carolina", null, TYPE.BOURBON, 1000, null],
  ["The Clover 10 Year 90 Proof North Carolina", 90, "North Carolina", null, TYPE.BOURBON, 1000, null],
  ["Three Chord Blended Bourbon Michigan", null, "Michigan", null, TYPE.BOURBON, 1000, null],
  ["Three Chord Strange Collaboration Michigan", null, "Michigan", null, TYPE.BOURBON, 1000, null],
  ["Tommy Bahama Washington Bourbon", null, "Washington", null, TYPE.BOURBON, 1000, null],
  ["Town Branch Bourbon", null, "Kentucky", "Alltech's Lexington Brewing & Distilling Co.", TYPE.BOURBON, 1200, null],
  ["Town Branch True Cask 108.1 Proof", 108.1, "Kentucky", "Alltech's Lexington Brewing & Distilling Co.", TYPE.BOURBON, 1000, 1600],
  ["The Wiseman Bourbon", null, "Kentucky", "Old Forester Distillery", TYPE.BOURBON, 1200, null],
  ["Yellowstone Select 93 Proof", 93, "Kentucky", "Limestone Branch Distillery", TYPE.BOURBON, 1200, null],
  ["Yellowstone Toasted", null, "Kentucky", "Limestone Branch Distillery", TYPE.BOURBON, 1200, 2400],
  ["Yellowstone Cognac & Brandy Cask", null, "Kentucky", "Limestone Branch Distillery", TYPE.BOURBON, 1200, 2400],
  ["Virgil Kaine Ginger Infused South Carolina", null, "South Carolina", "Virgil Kaine Whiskey", TYPE.AMERICAN, 1000, null],
  ["High West Cask Strength Bourbon", null, "Utah", "High West Distillery", TYPE.BOURBON, 1200, null],
  ["High West Double Rye", 92, "Utah", "High West Distillery", TYPE.RYE, 1200, null],
  ["High West Rendezvous Rye", 92, "Utah", "High West Distillery", TYPE.RYE, 1200, null],
  ["High West American Prairie Bourbon", 92, "Utah", "High West Distillery", TYPE.BOURBON, 1200, null],
  ["Watershed Ohio Bourbon", null, "Ohio", "Watershed Distillery", TYPE.BOURBON, 1000, null],
  ["Woodson Wine Finished Bourbon California", null, "California", null, TYPE.BOURBON, 1000, null],
  ["Woodinville 90 Proof Washington Bourbon", 90, "Washington", "Woodinville Whiskey Co.", TYPE.BOURBON, 1000, null],
  ["Woodinville 100 Proof Washington Bourbon", 100, "Washington", "Woodinville Whiskey Co.", TYPE.BOURBON, 1200, null],
  ["Woodinville Moscatel Finish Washington", null, "Washington", "Woodinville Whiskey Co.", TYPE.BOURBON, 1000, 1400],
  ["Wyoming Small Batch Bourbon", null, "Wyoming", "Wyoming Whiskey", TYPE.BOURBON, 1000, null],
  ["Wyoming Single Barrel Bourbon", null, "Wyoming", "Wyoming Whiskey", TYPE.BOURBON, 1000, null],
];

// ── HELPERS ───────────────────────────────────────────────

function normalize(str) {
  return String(str ?? "")
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const intersection = [...wordsA].filter(w => wordsB.has(w) && w.length > 2).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

// ── MAIN ─────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("Fetching existing whiskeys...");
  const { data: existing, error: fetchErr } = await supabase
    .from("whiskeys")
    .select("id, display_name, proof, distillery, region, whiskey_type_id");
  if (fetchErr) throw fetchErr;
  console.log(`  Found ${existing.length} existing whiskeys`);

  console.log("Fetching existing venue menu items...");
  const { data: existingMenu, error: menuErr } = await supabase
    .from("venue_menu_items")
    .select("whiskey_id, pour_size_ml")
    .eq("venue_id", HARTMANS_VENUE_ID);
  if (menuErr) throw menuErr;

  const existingMenuKeys = new Set(
    existingMenu.map(m => `${m.whiskey_id}`)
  );
  console.log(`  Found ${existingMenu.length} existing menu items`);

  let matched = 0;
  let inserted = 0;
  let skipped = 0;
  let menuInserted = 0;
  let menuSkipped = 0;

  for (const row of MENU) {
    const [name, proof, region, distillery, typeId, price1oz, price2oz] = row;

    // Find best match in existing whiskeys
    let bestMatch = null;
    let bestScore = 0;

    for (const w of existing) {
      const score = similarity(name, w.display_name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = w;
      }
    }

    let whiskeyId;

    if (bestScore >= 0.75) {
      // Good enough match — use existing
      whiskeyId = bestMatch.id;
      matched++;
      console.log(`  MATCH (${(bestScore * 100).toFixed(0)}%): "${name}" → "${bestMatch.display_name}"`);
    } else {
      // No match — insert new whiskey
      const canonical = normalize(name).replace(/\s+/g, "_");
      const { data: newW, error: insertErr } = await supabase
        .from("whiskeys")
        .insert({
          display_name: name,
          whiskey_canonical: canonical,
          proof: proof ?? null,
          region: region ?? null,
          distillery: distillery ?? null,
          whiskey_type_id: typeId,
          whiskey_type: getTypeName(typeId),
          category: getCategoryFromType(typeId),
          is_active: true,
          age_is_nas: true,
        })
        .select("id")
        .single();

      if (insertErr) {
        if (insertErr.message.includes("whiskeys_whiskey_canonical_key")) {
          // Canonical already exists — fetch the existing record by canonical
          const { data: existing2, error: fetchErr2 } = await supabase
            .from("whiskeys")
            .select("id, display_name")
            .eq("whiskey_canonical", canonical)
            .single();
          if (fetchErr2 || !existing2) {
            console.error(`  ERROR resolving canonical for "${name}":`, fetchErr2?.message);
            skipped++;
            continue;
          }
          whiskeyId = existing2.id;
          existing.push({ id: whiskeyId, display_name: name, proof, region, distillery, whiskey_type_id: typeId });
          matched++;
          console.log(`  CANONICAL MATCH: "${name}" → "${existing2.display_name}"`);
        } else {
          console.error(`  ERROR inserting "${name}":`, insertErr.message);
          skipped++;
          continue;
        }
      } else {
        whiskeyId = newW.id;
        existing.push({ id: whiskeyId, display_name: name, proof, region, distillery, whiskey_type_id: typeId });
        inserted++;
        console.log(`  NEW: "${name}"`);
      }
    }

    // Insert venue_menu_items
    const key = `${whiskeyId}`;
    if (existingMenuKeys.has(key)) {
      menuSkipped++;
      continue;
    }

    const { error: menuInsertErr } = await supabase
      .from("venue_menu_items")
      .insert({
        venue_id: HARTMANS_VENUE_ID,
        whiskey_id: whiskeyId,
        price_cents_1oz: price1oz,
        price_cents_2oz: price2oz ?? null,
        available: true,
      });

    if (menuInsertErr) {
      console.error(`  ERROR inserting menu item for "${name}":`, menuInsertErr.message);
    } else {
      existingMenuKeys.add(key);
      menuInserted++;
    }
  }

  console.log("\n── SUMMARY ──────────────────────────────────────────");
  console.log(`  Whiskeys matched to existing: ${matched}`);
  console.log(`  Whiskeys inserted as new:     ${inserted}`);
  console.log(`  Whiskeys skipped (error):     ${skipped}`);
  console.log(`  Menu items inserted:          ${menuInserted}`);
  console.log(`  Menu items skipped (exist):   ${menuSkipped}`);
}

function getTypeName(typeId) {
  const map = {
    "85050bc9-99b4-469a-84a2-dc3abf7ed1d0": "Bourbon",
    "d20cf63e-5736-4572-9c23-6f899b216a57": "Rye",
    "bffb54e3-cabc-4e67-8024-78ded8475343": "Tennessee Whiskey",
    "0cac00fc-a7ab-4c0a-894a-c40bdd25fdc7": "American Whiskey",
    "9349cb96-a41d-42f2-b98e-e2d11aa346a8": "Single Malt",
    "999f58bb-d56f-4f44-9d27-c184ab6b4eb5": "Blended Scotch",
    "3cde1227-e497-4a47-ba53-cb21d5d7b506": "Other",
  };
  return map[typeId] ?? "Other";
}

function getCategoryFromType(typeId) {
  const map = {
    "85050bc9-99b4-469a-84a2-dc3abf7ed1d0": "American",
    "d20cf63e-5736-4572-9c23-6f899b216a57": "American",
    "bffb54e3-cabc-4e67-8024-78ded8475343": "American",
    "0cac00fc-a7ab-4c0a-894a-c40bdd25fdc7": "American",
    "9349cb96-a41d-42f2-b98e-e2d11aa346a8": "Scotch",
    "999f58bb-d56f-4f44-9d27-c184ab6b4eb5": "Scotch",
    "3cde1227-e497-4a47-ba53-cb21d5d7b506": "Other",
  };
  return map[typeId] ?? "Other";
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});