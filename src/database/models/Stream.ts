import {
    AllowNull, BelongsTo, BelongsToMany,
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
import {Playlist} from "./Playlist";
import {
    BelongsToManyGetAssociationsMixin,
    BelongsToManySetAssociationsMixin,
    BelongsToSetAssociationMixin,
    NonAttribute
} from "sequelize";
import {Track} from "./Track";
import {TrackPlaylist} from "./TrackPlaylist";


// noinspection JSAnnotator
@Table({
    timestamps: true,
    updatedAt: false,
    deletedAt: false,
})
export class Stream extends Model<Stream> {
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
    @Unique
    @Column({type: DataType.STRING})
    host: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.INTEGER})
    port: number;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    endpoint: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    username: string;

    @AllowNull(false)
    @NotNull
    @Unique
    @Column({type: DataType.STRING})
    password: string;

    @AllowNull(false)
    @NotNull
    @Default(false)
    @Column({type: DataType.BOOLEAN})
    enabled: boolean;

    @AllowNull(false)
    @NotNull
    @Default(false)
    @Column({type: DataType.BOOLEAN})
    isRecursive: boolean;

    @AllowNull(true)
    @ForeignKey(() => Playlist)
    @Column(DataType.UUID)
    playlistId: string;

    @BelongsTo(() => Playlist)
    declare playlist: NonAttribute<Playlist>;
    declare setPlaylist: BelongsToSetAssociationMixin<Playlist, Playlist["id"]>;
}