"""initial schema

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import pathlib

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL = pathlib.Path(__file__).with_suffix(".sql")


def upgrade() -> None:
    op.execute(_SQL.read_text())


def downgrade() -> None:
    op.execute("""
        DO $$ DECLARE r RECORD; BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
    """)
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;')
    op.execute('DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;')
