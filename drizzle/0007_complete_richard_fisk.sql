CREATE TABLE `internal_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopPostId` int NOT NULL,
	`targetUrl` text NOT NULL,
	`targetType` enum('product','category','blog_post','home') NOT NULL,
	`anchorText` varchar(255) NOT NULL,
	`position` int,
	`clickCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internal_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`excerpt` text,
	`heroImageUrl` text,
	`heroImagePrompt` text,
	`targetKeyword` varchar(255) NOT NULL,
	`keywordSearchVolume` int,
	`keywordCompetition` varchar(20),
	`pillar` varchar(100) NOT NULL,
	`tags` json,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`isAiGenerated` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`clicksToMain` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_blog_posts_slug_unique` UNIQUE(`slug`)
);
