import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Reaction, ReactionLeanDocument } from 'src/schemas';
import { CreateReactionsDto } from './dto/create-reactions.dto';
import { FeedGateway } from 'src/gateway';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name) private reactionModel: Model<Reaction>,
    private readonly feedGateway: FeedGateway,
  ) {}

  async create(
    userId: string,
    createReactionDto: CreateReactionsDto,
  ): Promise<ReactionLeanDocument> {
    const newReaction = new this.reactionModel({
      ...createReactionDto,
      user_id: userId,
      reaction_type: 'like',
    });
    const savedReaction = await newReaction.save();

    return savedReaction.toObject() as unknown as ReactionLeanDocument;
  }

  async delete(userId: string, reactionId: string): Promise<void> {
    const result = await this.reactionModel
      .findByIdAndDelete({
        _id: new Types.ObjectId(reactionId),
        user_id: userId,
      })
      .exec();

    if (!result) {
      throw new NotFoundException(`Reaction with ID "${reactionId}" not found`);
    }

    return;
  }

  async onModuleInit() {
    const changeStream = this.reactionModel.watch();

    changeStream.on('change', (change) => {
      this.feedGateway.handleNewReaction(change.fullDocument);
    });
  }
}
