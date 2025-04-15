import {
    AllowNull,
    BelongsTo,
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
import {BelongsToSetAssociationMixin, NonAttribute} from "sequelize";


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