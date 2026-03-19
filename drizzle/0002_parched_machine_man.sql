CREATE TABLE `review_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`voteType` enum('helpful','unhelpful') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `review_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`authorName` varchar(255) NOT NULL,
	`authorEmail` varchar(320),
	`rating` int NOT NULL,
	`title` varchar(500),
	`body` text NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`unhelpfulCount` int NOT NULL DEFAULT 0,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
