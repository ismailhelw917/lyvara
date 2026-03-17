CREATE TABLE `analytics_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`productId` int,
	`blogPostId` int,
	`eventType` enum('product_click','affiliate_click','page_view','blog_view','search','filter') NOT NULL,
	`sessionId` varchar(128),
	`userAgent` text,
	`referrer` text,
	`page` varchar(500),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` enum('product_fetch','blog_generation','layout_optimization','performance_scoring','hero_image_generation','cleanup') NOT NULL,
	`status` enum('running','success','failed','partial') NOT NULL,
	`message` text,
	`details` json,
	`productsUpdated` int DEFAULT 0,
	`postsGenerated` int DEFAULT 0,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `automation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`heroImageUrl` text,
	`heroImagePrompt` text,
	`category` enum('style_guide','trend_report','gift_ideas','care_tips','brand_spotlight','seasonal','promotional') DEFAULT 'style_guide',
	`tags` json,
	`featuredProductIds` json,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`isAiGenerated` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`asin` varchar(20) NOT NULL,
	`title` text NOT NULL,
	`brand` varchar(255),
	`description` text,
	`category` enum('necklaces','bracelets','rings','earrings','pendants','sets','other') NOT NULL DEFAULT 'other',
	`metalType` enum('gold','silver','rose_gold','white_gold','platinum','mixed') NOT NULL DEFAULT 'gold',
	`price` decimal(10,2),
	`originalPrice` decimal(10,2),
	`currency` varchar(10) DEFAULT 'USD',
	`imageUrl` text,
	`additionalImages` json,
	`affiliateUrl` text NOT NULL,
	`amazonRating` float,
	`reviewCount` int DEFAULT 0,
	`clickCount` int NOT NULL DEFAULT 0,
	`conversionCount` int NOT NULL DEFAULT 0,
	`estimatedRevenue` decimal(10,2) DEFAULT '0',
	`performanceScore` float NOT NULL DEFAULT 0,
	`ctr` float NOT NULL DEFAULT 0,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isHero` boolean NOT NULL DEFAULT false,
	`displayRank` int NOT NULL DEFAULT 100,
	`imageSize` enum('small','medium','large','hero') NOT NULL DEFAULT 'medium',
	`isActive` boolean NOT NULL DEFAULT true,
	`tags` json,
	`priceDropPercent` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastFetchedAt` timestamp DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_asin_unique` UNIQUE(`asin`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`key`)
);
