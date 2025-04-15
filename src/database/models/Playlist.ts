import {
    AllowNull,
    BelongsTo,
    BelongsToMany,
    Column,
    DataType,
    Default,
    ForeignKey,
    Model,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "sequelize-typescript";
import {Stream} from "./Stream";
import {
    BelongsToManyGetAssociationsMixin,
    BelongsToManySetAssociationsMixin,
    BelongsToSetAssociationMixin,
    NonAttribute
} from "sequelize";
import {TrackPlaylist} from "./TrackPlaylist";
import {Track} from "./Track";


// noinspection JSAnnotator
@Table({
    timestamps: true,
    updatedAt: false,
    deletedAt: false,
})
export class Playlist extends Model<Playlist> {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    name: string;

    @AllowNull(false)
    @NotNull
    @Column({type: DataType.STRING})
    description: string;

    @AllowNull(true)
    @Column({type: DataType.STRING})
    coverImage: string;

    @AllowNull(true)
    @ForeignKey(() => Stream)
    @Column(DataType.UUID)
    streamId: string;

    @BelongsTo(() => Stream)
    declare stream: NonAttribute<Stream>;
    declare setStream: BelongsToSetAssociationMixin<Stream, Stream["id"]>;

    @BelongsToMany(() => Track, () => TrackPlaylist)
    declare tracks: NonAttribute<Track[]>;
    declare getTracks: BelongsToManyGetAssociationsMixin<Track>;
    declare setTracks: BelongsToManySetAssociationsMixin<Track, Track['id']>;
}