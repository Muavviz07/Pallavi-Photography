"""add_s3_fields_to_images

Revision ID: s3_garage_fields_001
Revises: 356c92857feb
Create Date: 2026-07-20 15:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 's3_garage_fields_001'
down_revision: Union[str, None] = '356c92857feb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('images', sa.Column('file_name', sa.String(length=255), nullable=True))
    op.add_column('images', sa.Column('s3_key', sa.String(length=500), nullable=True))
    op.create_index(op.f('ix_images_s3_key'), 'images', ['s3_key'], unique=False)
    op.add_column('images', sa.Column('s3_url', sa.String(length=1000), nullable=True))
    op.add_column('images', sa.Column('image_type', sa.String(length=50), nullable=True))
    op.add_column('images', sa.Column('client_id', sa.String(length=255), nullable=True))
    op.add_column('images', sa.Column('local_path', sa.String(length=500), nullable=True))
    op.add_column('images', sa.Column('content_type', sa.String(length=50), nullable=True))
    op.alter_column('images', 'original_url', existing_type=sa.String(length=500), nullable=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_images_s3_key'), table_name='images')
    op.drop_column('images', 'content_type')
    op.drop_column('images', 'local_path')
    op.drop_column('images', 'client_id')
    op.drop_column('images', 'image_type')
    op.drop_column('images', 's3_url')
    op.drop_column('images', 's3_key')
    op.drop_column('images', 'file_name')
