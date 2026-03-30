CREATE TABLE `blog_posts_facebook_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blogPostId` int NOT NULL,
	`facebookPostId` varchar(255) NOT NULL,
	`status` enum('pending','published','scheduled','failed') NOT NULL DEFAULT 'pending',
	`scheduledFor` timestamp,
	`publishedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_facebook_shares_id` PRIMARY KEY(`id`)
);
