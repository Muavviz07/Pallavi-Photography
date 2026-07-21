"""add gallery_images junction table

Revision ID: 1fac1297129c
Revises: a1b2c3d4e5f6
Create Date: 2026-07-06 15:46:34.312588

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "1fac1297129c"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gallery_images",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("gallery_id", sa.Uuid(), nullable=False),
        sa.Column("image_id", sa.Uuid(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["gallery_id"], ["galleries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["image_id"], ["images.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("gallery_id", "image_id", name="uq_gallery_image"),
    )
    op.create_index(
        op.f("ix_gallery_images_gallery_id"),
        "gallery_images",
        ["gallery_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_gallery_images_image_id"), "gallery_images", ["image_id"], unique=False
    )

    op.execute("""
        INSERT INTO gallery_images (id, gallery_id, image_id, sort_order, created_at)
        SELECT gen_random_uuid(), i.gallery_id, i.id, i.sort_order, i.created_at
        FROM images i
        WHERE i.gallery_id IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_index(op.f("ix_gallery_images_image_id"), table_name="gallery_images")
    op.drop_index(op.f("ix_gallery_images_gallery_id"), table_name="gallery_images")
    op.drop_table("gallery_images")
